import { createElement } from "react";
import { COLOR_TEXT_CLASS } from "@/lib/board/color-tokens";
import { resolveStateIcon, type WorkflowState } from "@/lib/board/workflow-config";
import { cn } from "@/lib/utils";

const sizeMap = {
  sm: "size-3.5",
  md: "size-4",
} as const;

export interface StatusIconProps {
  /** Yalnızca görsel alanlar — çağıranların tam durumu taşımasına gerek yok. */
  state: Pick<WorkflowState, "icon" | "color">;
  size?: keyof typeof sizeMap;
  className?: string;
}

/**
 * Durum ikonu artık sabit bir eşlemeden değil durumun kendi kaydından geliyor:
 * kullanıcı ayarlardan ikonu ve rengi seçiyor. Renk dokuz tema tokeniyle sınırlı
 * olduğu için açık/koyu tema kontrastı garanti kalıyor.
 */
export function StatusIcon({ state, size = "md", className }: StatusIconProps) {
  // `createElement`: ikon çalışma zamanında çözülüyor ve onu render sırasında
  // büyük harfli bir değişkene atamak `react-hooks/static-components`
  // kuralını tetikliyor (her render'da yeni bileşen sanılıyor).
  return createElement(resolveStateIcon(state.icon), {
    className: cn(sizeMap[size], COLOR_TEXT_CLASS[state.color], className),
  });
}
