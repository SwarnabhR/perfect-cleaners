import Svg, { Line, Path } from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
}

export default function PCMonogram({ size = 32, color = '#fff' }: Props) {
  return (
    <Svg
      width={size}
      height={size * (140 / 120)}
      viewBox="0 0 120 140"
      fill="none"
      stroke={color}
      strokeWidth={2.2}
      strokeLinecap="round"
    >
      <Line x1="32" y1="14" x2="32" y2="126" />
      <Path d="M32 24 H78 a18 18 0 0 1 18 18 v0 a18 18 0 0 1 -18 18 H32" />
      <Path d="M32 60 H72 a14 14 0 0 1 14 14 v0 a14 14 0 0 1 -14 14 H32" />
      <Line x1="32" y1="100" x2="64" y2="100" />
    </Svg>
  );
}
