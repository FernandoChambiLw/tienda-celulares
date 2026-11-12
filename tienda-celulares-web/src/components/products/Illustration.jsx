// Ilustraciones SVG de producto: reemplazan a la foto mientras no exista una.
// Cada una pesa unos cientos de bytes y toma el color real del producto.
const SHADE = 'rgba(3, 23, 16, 0.28)';
const LENS = '#0b130f';
const LENS_RING = '#2c3a33';

function Phone({ color }) {
  return (
    <>
      <rect x="62" y="20" width="76" height="160" rx="16" fill={color} />
      <path d="M62 36a16 16 0 0 1 16-16h16L62 112Z" fill="#fff" opacity="0.12" />
      <rect x="70" y="28" width="34" height="36" rx="11" fill={SHADE} />
      <circle cx="81" cy="39" r="7" fill={LENS} />
      <circle cx="81" cy="39" r="3" fill={LENS_RING} />
      <circle cx="94" cy="53" r="6" fill={LENS} />
      <circle cx="94" cy="53" r="2.5" fill={LENS_RING} />
      <circle cx="128" cy="34" r="2.5" fill="#fff" opacity="0.55" />
    </>
  );
}

function Headphones({ color }) {
  return (
    <>
      <path
        d="M52 120V98a48 48 0 0 1 96 0v22"
        fill="none"
        stroke={color}
        strokeWidth="9"
        strokeLinecap="round"
      />
      <rect x="38" y="108" width="28" height="48" rx="13" fill={color} />
      <rect x="134" y="108" width="28" height="48" rx="13" fill={color} />
      <rect x="45" y="117" width="10" height="30" rx="5" fill={SHADE} />
      <rect x="145" y="117" width="10" height="30" rx="5" fill={SHADE} />
    </>
  );
}

function Charger({ color }) {
  return (
    <>
      <path
        d="M100 44V28q0-14 14-14h22"
        fill="none"
        stroke={color}
        strokeWidth="7"
        strokeLinecap="round"
      />
      <rect x="66" y="44" width="68" height="84" rx="15" fill={color} />
      <path d="M66 60a16 16 0 0 1 16-16h14L66 100Z" fill="#fff" opacity="0.12" />
      <rect x="88" y="62" width="24" height="12" rx="6" fill={SHADE} />
      <rect x="84" y="128" width="8" height="20" rx="2" fill="#aab4af" />
      <rect x="108" y="128" width="8" height="20" rx="2" fill="#aab4af" />
    </>
  );
}

function Case({ color }) {
  return (
    <>
      <rect x="62" y="20" width="76" height="160" rx="19" fill={color} />
      <rect x="70" y="28" width="36" height="40" rx="12" fill="#fbf7ef" opacity="0.9" />
      <circle cx="82" cy="40" r="7" fill={LENS} />
      <circle cx="82" cy="40" r="3" fill={LENS_RING} />
      <circle cx="95" cy="56" r="6" fill={LENS} />
      <rect x="86" y="160" width="28" height="6" rx="3" fill="#fff" opacity="0.35" />
    </>
  );
}

function Glass({ color }) {
  return (
    <>
      <rect x="64" y="22" width="72" height="156" rx="13" fill="#cdefe4" opacity="0.75" stroke={color} strokeWidth="3" />
      <path d="M76 152 126 62M76 172 126 82" stroke="#fff" strokeWidth="8" strokeLinecap="round" opacity="0.7" />
      <rect x="90" y="31" width="20" height="5" rx="2.5" fill={color} />
    </>
  );
}

function Band({ color }) {
  return (
    <>
      <rect x="86" y="8" width="28" height="184" rx="12" fill={color} />
      <rect x="66" y="62" width="68" height="82" rx="22" fill={LENS} />
      <rect x="73" y="69" width="54" height="68" rx="16" fill="#1d3a2d" />
      <path d="M86 96h28" stroke="#6fecc4" strokeWidth="5" strokeLinecap="round" />
      <circle cx="100" cy="116" r="5" fill="#f2a93b" />
    </>
  );
}

function Box({ color }) {
  return (
    <>
      <rect x="54" y="62" width="92" height="84" rx="14" fill={color} />
      <path d="M54 88h92" stroke="#fff" strokeWidth="6" opacity="0.35" />
      <rect x="88" y="62" width="24" height="26" fill="#fff" opacity="0.3" />
    </>
  );
}

const SHAPES = {
  phone: Phone,
  headphones: Headphones,
  charger: Charger,
  case: Case,
  glass: Glass,
  band: Band,
  box: Box,
};

export default function Illustration({ kind, color, className }) {
  const Shape = SHAPES[kind] ?? Box;
  return (
    <svg className={className} viewBox="0 0 200 200" fill="none" aria-hidden="true" focusable="false">
      <ellipse cx="100" cy="186" rx="44" ry="6" fill="#031710" opacity="0.1" />
      {/* Borde sutil heredado por todas las formas: los productos claros no se pierden en el fondo. */}
      <g stroke="rgba(3, 23, 16, 0.2)" strokeWidth="1.5">
        <Shape color={color} />
      </g>
    </svg>
  );
}
