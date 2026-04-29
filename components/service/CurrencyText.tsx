import { Text, TextProps } from "react-native";

type Props = TextProps & { cents: number | null | undefined; prefix?: string };

export function CurrencyText({ cents, prefix = "¥", style, ...rest }: Props) {
  if (cents == null) return <Text style={style} {...rest}>{prefix}—</Text>;
  const yuan = (cents / 100).toFixed(2);
  const parts = yuan.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return <Text style={style} {...rest}>{prefix}{parts.join(".")}</Text>;
}
