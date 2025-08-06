import subprocess
import re

def parse_queue_stats(output):
    stats = {
        "backlog": 0,
        "drops": 0,
        "overlimits": 0
    }

    # Match backlog line (bytes and packets)
    backlog_match = re.search(r'backlog\s+(\d+)([a-zA-Z]*)\s+(\d+)p', output)
    if backlog_match:
        size = int(backlog_match.group(1))
        unit = backlog_match.group(2).lower()
        packets = int(backlog_match.group(3))
        if unit == 'k':
            size *= 1000
        elif unit == 'm':
            size *= 1000000
        stats["backlog"] = size

    # Match drops
    drops_match = re.search(r'drop\s+(\d+)', output)
    if drops_match:
        stats["drops"] = int(drops_match.group(1))

    # Match overlimits
    overlimit_match = re.search(r'overlimits\s+(\d+)', output)
    if overlimit_match:
        stats["overlimits"] = int(overlimit_match.group(1))

    return stats

def get_queue_stats(interface):
    try:
        result = subprocess.check_output(["sudo", "tc", "-s", "qdisc", "show", "dev", interface])
        return parse_queue_stats(result.decode())
    except subprocess.CalledProcessError as e:
        print(f"Error executing tc: {e}")
        return {}

if __name__ == "__main__":
    interface = "br7"  # change to "ens19" if needed
    stats = get_queue_stats(interface)
    print(f"Queue Stats on {interface}:")
    print(stats)
