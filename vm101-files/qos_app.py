from ryu.base import app_manager
from ryu.controller import ofp_event
from ryu.controller.handler import set_ev_cls, MAIN_DISPATCHER
from ryu.lib.packet import packet, ethernet, ipv4, tcp, udp
import sys
sys.path.append('/home/satya')
from dpi_decoder import classify_packet  # ✅ Make sure this line is back!

class QoSApp(app_manager.RyuApp):

    def __init__(self, *args, **kwargs):
        super(QoSApp, self).__init__(*args, **kwargs)

    @set_ev_cls(ofp_event.EventOFPPacketIn, MAIN_DISPATCHER)
    def classify_and_prioritize(self, ev):
        msg = ev.msg
        pkt = packet.Packet(msg.data)
        app_type = classify_packet(pkt)

        if app_type in ["VOIP", "VIDEO"]:
            priority = "HIGH"
        elif app_type in ["FTP", "SSH"]:
            priority = "LOW"
        else:
            priority = "NORMAL"

        print(f"[QoS] Packet classified as {app_type} — Assigning {priority} priority")

