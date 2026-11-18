INK="#1E1B18"; PAPER="#F1EAE0"; RED="#CE472E"; MUTED="#9A9087"
DEFS=f'''<defs>
<linearGradient id="w2" x1="0" y1="0" x2="0.2" y2="1"><stop offset="0" stop-color="#3A332D"/><stop offset="1" stop-color="#6E645A" stop-opacity=".92"/></linearGradient>
<linearGradient id="wl" x1="0" y1="0" x2="0.2" y2="1"><stop offset="0" stop-color="#8F8478"/><stop offset="1" stop-color="#C9BEB0" stop-opacity=".9"/></linearGradient>
<linearGradient id="wh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#B9AC9B"/><stop offset="1" stop-color="#D8CDBD"/></linearGradient>
<linearGradient id="wp" x1="0" y1="0" x2="0.15" y2="1"><stop offset="0" stop-color="#F7F2E9"/><stop offset=".7" stop-color="#EDE4D6"/><stop offset="1" stop-color="#DCD0BF"/></linearGradient>
<linearGradient id="wp2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FAF6EF"/><stop offset="1" stop-color="#E9DFD0"/></linearGradient>
<radialGradient id="ember"><stop offset="0" stop-color="{RED}"/><stop offset=".55" stop-color="{RED}" stop-opacity=".75"/><stop offset="1" stop-color="{RED}" stop-opacity="0"/></radialGradient>
<filter id="wash" x="-30%" y="-30%" width="160%" height="160%">
 <feTurbulence type="fractalNoise" baseFrequency="0.3" numOctaves="2" seed="7" result="n"/>
 <feDisplacementMap in="SourceGraphic" in2="n" scale="0.7" xChannelSelector="R" yChannelSelector="G" result="d"/>
 <feGaussianBlur in="d" stdDeviation="0.6" result="h"/><feComponentTransfer in="h" result="hA"><feFuncA type="linear" slope="0.3"/></feComponentTransfer>
 <feGaussianBlur in="d" stdDeviation="0.15" result="s"/>
 <feTurbulence type="fractalNoise" baseFrequency="2.4" numOctaves="1" seed="5" result="g"/>
 <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.3 1.06" result="gA"/>
 <feComposite in="s" in2="gA" operator="in" result="c"/><feMerge><feMergeNode in="hA"/><feMergeNode in="c"/></feMerge></filter>
<filter id="line" x="-30%" y="-30%" width="160%" height="160%"><feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="2" seed="9" result="n"/>
 <feDisplacementMap in="SourceGraphic" in2="n" scale="0.55"/></filter>
<filter id="glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="1.1"/></filter>
<filter id="paper"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="2"/>
 <feColorMatrix type="matrix" values="0 0 0 0 0.45  0 0 0 0 0.38  0 0 0 0 0.3  0 0 0 0.10 0"/></filter></defs>'''

MODE={"light":True}
