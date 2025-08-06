# dpi_decoder.py
import ctypes
from ctypes import c_char_p, c_int, POINTER, c_uint32
from ryu.lib.packet import tcp, udp

ndpi = ctypes.CDLL("libndpi.so")
ndpi.ndpi_flow_struct = ctypes.c_void_p

# Initialize detection module
ndpi.ndpi_init_detection_module.restype = ctypes.c_void_p
ndpi.ndpi_exit_detection_module.argtypes = [ctypes.c_void_p]

# Simple parsing function: inspect raw payload (for standalone decoding)
def detect_app(payload: bytes) -> str:
    size = len(payload)
    c_payload = ctypes.create_string_buffer(payload, size)
    detection = ndpi.ndpi_init_detection_module()
    flow = ndpi.ndpi_flow_struct()
    protocol = ndpi.ndpi_detection_giveup_flow(detection, ctypes.byref(flow), c_payload, size, ctypes.c_void_p(0))
    ndpi.ndpi_exit_detection_module(detection)
    return ndpi.ndpi_proto_to_string(protocol).decode()


# ✅ This function is used by Ryu controller for inline packet classification
def classify_packet(pkt):
    # Try extracting L4 protocol
    tcp_pkt = pkt.get_protocol(tcp.tcp)
    udp_pkt = pkt.get_protocol(udp.udp)

    if tcp_pkt:
        if tcp_pkt.dst_port == 80:
            return "HTTP"
        elif tcp_pkt.dst_port == 443:
            return "HTTPS"
        elif tcp_pkt.dst_port == 5001:
            return "IPERF"
        else:
            return f"TCP:{tcp_pkt.dst_port}"
    elif udp_pkt:
        if udp_pkt.dst_port == 53:
            return "DNS"
        else:
            return f"UDP:{udp_pkt.dst_port}"
    else:
        return "OTHER"

