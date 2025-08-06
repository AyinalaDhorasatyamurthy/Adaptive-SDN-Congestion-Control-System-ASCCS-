import subprocess
import signal
import json
import time
import re
from datetime import datetime, timezone

NDPI_READER_PATH = "/home/satya/nDPI/example/ndpiReader"  # ✅ Update if needed
INTERFACE = "ens19"
CAPTURE_SECONDS = 10

# Known signatures to match in ndpiReader output
SIGNATURE_MAP = {
    "Content-Type: audio/mpeg": "MP3",
    "Content-Type: video/mp4": "MP4",
    "Host: youtube.com": "YouTube",
    "Host: zoom.us": "Zoom",
    "SNI: zoom.us": "Zoom",
    "SNI: youtube.com": "YouTube",
    "BitTorrent": "BitTorrent"
}

def parse_ndpi_output(output):
    protocol_counts = {}
    total_packets = 0
    lines = output.splitlines()

    for line in lines:
        if "[proto:" in line:
            total_packets += 1

            # Extract proto number and name
            match = re.search(r"\[proto:\s*(\d+)\.\s*(.*?)\]", line)
            if match:
                proto_name = match.group(2).strip()
                protocol_counts[proto_name] = protocol_counts.get(proto_name, 0) + 1

            # Detect known app signatures
            for signature, label in SIGNATURE_MAP.items():
                if signature in line:
                    protocol_counts[label] = protocol_counts.get(label, 0) + 1

    return total_packets, protocol_counts

def run_dpi_capture():
    try:
        print("▶️ Running DPI capture...")

        cmd = [
            "sudo", NDPI_READER_PATH,
            "-i", INTERFACE,
            "-v", "3"
        ]

        process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

        time.sleep(CAPTURE_SECONDS)
        process.send_signal(signal.SIGINT)

        try:
            stdout, stderr = process.communicate(timeout=5)
        except subprocess.TimeoutExpired:
            process.kill()
            stdout, stderr = process.communicate()

        stdout = stdout.strip()
        stderr = stderr.strip()
        returncode = process.returncode

        print("↩️ Return Code:", returncode)
        print("📤 STDOUT:\n", stdout if stdout else "(empty)")
        print("📥 STDERR:\n", stderr if stderr else "(empty)")

        if returncode != 0 or not stdout:
            return {
                "status": "error",
                "message": "ndpiReader failed or returned empty output",
                "returncode": returncode,
                "stderr": stderr,
                "stdout": stdout
            }

        total, proto_counts = parse_ndpi_output(stdout)
        timestamp = datetime.now(timezone.utc).isoformat()

        return {
            "status": "success",
            "protocol_counts": proto_counts,
            "total_packets": total,
            "timestamp": timestamp
        }

    except Exception as e:
        print("❌ DPI exception:", e)
        return {
            "status": "error",
            "message": str(e)
        }

if __name__ == "__main__":
    result = run_dpi_capture()
    print(json.dumps(result, indent=2))
