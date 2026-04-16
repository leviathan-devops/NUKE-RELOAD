#!/usr/bin/env python3
"""
kraken-agent-wrapper.py - HTTP daemon for Kraken agent task execution

Runs on host, accepts HTTP requests from containers to spawn Docker containers.
This solves the problem of python3 not being available inside opencode containers.

Usage:
    python3 kraken-agent-wrapper.py [--port PORT]

API:
    POST /execute
    Body: {"task": "...", "model": "...", "timeout": 60, "cleanup": true}
    Response: {"success": true, "text": "...", "error": null, ...}
"""

import argparse
import json
import subprocess
import time
import os
import sys
import socketserver
import threading
from pathlib import Path
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import parse_qs

# Constants
DEFAULT_PORT = 18086
IMAGE = "ghcr.io/anomalyco/opencode"
CONFIG_PATH = Path.home() / ".config/opencode"
OPENCODE_WORKSPACE = Path.home() / "OPENCODE_WORKSPACE"
PORTS = list(range(18086, 18100))
CONTAINER_NAME_PREFIX = "kraken-wrap-"

# Plugin directories to mount
PLUGIN_MOUNTS = [
    ("skills", CONFIG_PATH / "skills", "/root/.config/opencode/skills"),
    (
        ".shark",
        OPENCODE_WORKSPACE / ".shark",
        "/home/leviathan/OPENCODE_WORKSPACE/.shark",
    ),
    (
        ".manta",
        OPENCODE_WORKSPACE / ".manta",
        "/home/leviathan/OPENCODE_WORKSPACE/.manta",
    ),
    (
        ".Spider",
        OPENCODE_WORKSPACE / ".Spider",
        "/home/leviathan/OPENCODE_WORKSPACE/.Spider",
    ),
]


def get_api_key(name: str) -> str | None:
    return os.environ.get(name)


def find_free_port() -> int:
    import socket

    for port in PORTS:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        try:
            sock.bind(("127.0.0.1", port))
            sock.close()
            return port
        except OSError:
            continue
    raise RuntimeError(f"No free ports in {PORTS}")


def container_exists(name: str) -> bool:
    result = subprocess.run(
        ["docker", "ps", "-a", "-q", "-f", f"name={name}"],
        capture_output=True,
        text=True,
    )
    return bool(result.stdout.strip())


def docker_kill(name: str) -> None:
    subprocess.run(["docker", "kill", name], capture_output=True)
    time.sleep(0.5)


def cleanup_session(container_name: str, port: int) -> None:
    try:
        subprocess.run(
            [
                "docker",
                "exec",
                container_name,
                "opencode",
                "session",
                "terminate",
                "--all",
            ],
            capture_output=True,
            text=True,
            timeout=5,
        )
    except:
        pass
    try:
        subprocess.run(
            ["docker", "exec", container_name, "pkill", "-f", "opencode"],
            capture_output=True,
            text=True,
            timeout=5,
        )
    except:
        pass


def _build_docker_cmd(name: str, port: int, workspace: str | None) -> list:
    cmd = [
        "docker",
        "run",
        "-d",
        "--rm",
        "--name",
        name,
        "-p",
        f"{port}:8080",
        "-v",
        f"{CONFIG_PATH}:/root/.config/opencode:ro",
        "-v",
        f"{OPENCODE_WORKSPACE}:/home/leviathan/OPENCODE_WORKSPACE:ro",
    ]
    for src_name, src_path, dst_path in PLUGIN_MOUNTS:
        if src_path.exists():
            cmd += ["-v", f"{src_path}:{dst_path}:ro"]
    if workspace:
        cmd += ["-v", f"{os.path.abspath(workspace)}:/workspace:rw"]
    else:
        import tempfile

        tmp_dir = tempfile.mkdtemp(prefix="kraken-ws-")
        cmd += ["-v", f"{tmp_dir}:/workspace:rw"]
    for key in [
        "MINIMAX_API_KEY",
        "DEEPSEEK_API_KEY",
        "GOOGLE_API_KEY",
        "OPENAI_API_KEY",
        "GLM_API_KEY",
        "ZHIPU_API_KEY",
        "SHARK_GEMINI_PROXY",
        "OPENCODE_API_KEY",
    ]:
        val = get_api_key(key)
        if val:
            cmd += ["-e", f"{key}={val}"]
    cmd += [IMAGE, "serve", "--port", "8080", "--hostname", "0.0.0.0"]
    return cmd


def wait_healthy(port: int, timeout: int = 30) -> bool:
    import urllib.request
    import sys

    print(f"[KrakenWrapper] Waiting for container health on port {port}", flush=True)
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            url = f"http://localhost:{port}/global/health"
            with urllib.request.urlopen(url, timeout=2) as r:
                if b"healthy" in r.read():
                    print(
                        f"[KrakenWrapper] Container healthy on port {port}", flush=True
                    )
                    return True
        except Exception as e:
            print(f"[KrakenWrapper] Health check failed: {e}", flush=True)
            pass
        time.sleep(1)
    print(f"[KrakenWrapper] Container health timeout on port {port}", flush=True)
    return False


def execute_task(
    task: str,
    model: str = "minimax/MiniMax-M2.7",
    timeout: int = 60,
    cleanup: bool = True,
) -> dict:
    """Execute a task in a Docker container and return result."""
    import urllib.request

    # Find free port
    port = find_free_port()
    container_name = f"{CONTAINER_NAME_PREFIX}{os.getpid()}"

    # Start container
    cmd = _build_docker_cmd(container_name, port, None)
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        return {
            "success": False,
            "error": f"Failed to start container: {result.stderr}",
        }

    # Wait for health
    if not wait_healthy(port, 30):
        docker_kill(container_name)
        return {"success": False, "error": "Container failed to become healthy"}

    try:
        # Run the task via opencode CLI
        run_cmd = [
            "docker",
            "exec",
            container_name,
            "opencode",
            "run",
            "--model",
            model,
            "--task",
            task,
            "--format",
            "json",
            "--no-input",
        ]

        result = subprocess.run(
            run_cmd,
            capture_output=True,
            text=True,
            timeout=timeout,
            env={**os.environ, "OPENCODE_WORKSPACE": "/workspace"},
        )

        # Parse output
        try:
            output = json.loads(result.stdout) if result.stdout else {}
        except:
            output = {
                "text": result.stdout or result.stderr,
                "success": result.returncode == 0,
            }

        output["success"] = output.get("success", result.returncode == 0)
        output["container"] = container_name
        output["port"] = port

        return output

    except subprocess.TimeoutExpired:
        return {
            "success": False,
            "error": f"Task timeout after {timeout} seconds",
            "container": container_name,
            "port": port,
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "container": container_name,
            "port": port,
        }
    finally:
        if cleanup:
            cleanup_session(container_name, port)
            docker_kill(container_name)


class KrakenHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path == "/execute":
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length).decode("utf-8")

            try:
                req = json.loads(body)
                result = execute_task(
                    task=req.get("task", ""),
                    model=req.get("model", "minimax/MiniMax-M2.7"),
                    timeout=req.get("timeout", 60),
                    cleanup=req.get("cleanup", True),
                )
                response = json.dumps(result)
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(response.encode())
            except Exception as e:
                error = json.dumps({"success": False, "error": str(e)})
                self.send_response(500)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(error.encode())
        else:
            self.send_response(404)
            self.end_headers()

    def do_GET(self):
        if self.path == "/health":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"status": "ok"}).encode())
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format, *args):
        print(f"[KrakenWrapper] {format % args}")


def run_server(port: int):
    server = HTTPServer(("127.0.0.1", port), KrakenHandler)
    print(f"[KrakenWrapper] Starting on port {port}")
    server.serve_forever()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Kraken Agent HTTP Wrapper")
    parser.add_argument(
        "--port", type=int, default=DEFAULT_PORT, help="Port to listen on"
    )
    args = parser.parse_args()
    run_server(args.port)
