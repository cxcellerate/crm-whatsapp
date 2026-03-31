interface Props {
  children: React.ReactNode;
  color?: string;
  variant?: 'solid' | 'soft';
}

export function Badge({ children, color = '#3DA13E', variant = 'soft' }: Props) {
  const style =
    variant === 'soft'
      ? { backgroundColor: color + '22', color }
      : { backgroundColor: color, color: '#fff' };

  return (
    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium" style={style}>
      {children}
    </span>
  );
}
