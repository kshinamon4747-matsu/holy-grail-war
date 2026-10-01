import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import jaCommon from "./locales/ja/common.json";
import jaIncantation from "./locales/ja/incantation.json";
import jaSimulation from "./locales/ja/simulation.json";
import jaTrpg from "./locales/ja/trpg.json";

i18n.use(initReactI18next).init({
  lng: "ja",
  fallbackLng: "ja",
  ns: ["common", "incantation", "simulation", "trpg"],
  defaultNS: "common",
  resources: {
    ja: { common: jaCommon, incantation: jaIncantation, simulation: jaSimulation, trpg: jaTrpg },
  },
  interpolation: { escapeValue: false },
});

export default i18n;
