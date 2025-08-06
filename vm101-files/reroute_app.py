from ryu.base import app_manager
from ryu.controller import ofp_event
from ryu.controller.handler import CONFIG_DISPATCHER, MAIN_DISPATCHER, set_ev_cls
from ryu.ofproto import ofproto_v1_3
from ryu.app.wsgi import ControllerBase, WSGIApplication, route
from webob import Response  # Required for REST response

reroute_instance_name = 'reroute_app'

class RerouteApp(app_manager.RyuApp):
    OFP_VERSIONS = [ofproto_v1_3.OFP_VERSION]
    _CONTEXTS = {'wsgi': WSGIApplication}

    def __init__(self, *args, **kwargs):
        super(RerouteApp, self).__init__(*args, **kwargs)
        wsgi = kwargs['wsgi']
        wsgi.register(RerouteController, {reroute_instance_name: self})
        self.datapaths = {}

    @set_ev_cls(ofp_event.EventOFPSwitchFeatures, CONFIG_DISPATCHER)
    def switch_features_handler(self, ev):
        datapath = ev.msg.datapath
        self.datapaths[datapath.id] = datapath

    def install_reroute_flow(self, datapath):
        ofproto = datapath.ofproto
        parser = datapath.ofproto_parser

        # Match TCP traffic on port 8000
        match = parser.OFPMatch(eth_type=0x0800, ip_proto=6, tcp_dst=8000)
        
        # Redirect to port 2 (can be changed based on your topology)
        actions = [parser.OFPActionOutput(2)]

        inst = [parser.OFPInstructionActions(ofproto.OFPIT_APPLY_ACTIONS, actions)]
        mod = parser.OFPFlowMod(datapath=datapath, priority=100,
                                match=match, instructions=inst)
        datapath.send_msg(mod)

class RerouteController(ControllerBase):
    def __init__(self, req, link, data, **config):
        super(RerouteController, self).__init__(req, link, data, **config)
        self.reroute_app = data[reroute_instance_name]

    @route('reroute', '/reroute', methods=['POST'])
    def reroute(self, req, **kwargs):
        for dp in self.reroute_app.datapaths.values():
            self.reroute_app.install_reroute_flow(dp)
        return Response(status=200, body="Reroute applied")
