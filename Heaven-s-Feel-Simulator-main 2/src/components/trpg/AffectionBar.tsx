import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { getTier, TIER_COLORS, TIER_LABELS_JA } from "../../engine/affection";

interface Props {
  affection: number;
  compact?: boolean;
}

export default function AffectionBar({ affection, compact = false }: Props) {
  const { t } = useTranslation("trpg");
  const tier = getTier(affection);
  const color = TIER_COLORS[tier];
  const label = TIER_LABELS_JA[tier];

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <div
          className="h-1.5 rounded-full overflow-hidden"
          style={{ width: "48px", background: "rgba(255,255,255,0.08)" }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ background: color }}
            initial={false}
            animate={{ width: `${affection}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
        <span className="text-[9px] font-medium" style={{ color }}>{label}</span>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[15px] text-gray-400">{t("affectionNotification.label")}</span>
        <span className="text-[15px] font-bold" style={{ color }}>
          {label} ({affection})
        </span>
      </div>
      <div
        className="h-2 rounded-full overflow-hidden"
        style={{ background: "rgba(255,255,255,0.08)" }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={false}
          animate={{ width: `${affection}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
