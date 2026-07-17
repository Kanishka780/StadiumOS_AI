export const MAP_TRANSLATIONS = {
  en: {
    twinTitle: 'Interactive Stadium Digital Twin (Schematic Map)',
    normal: 'Normal Density',
    warning: 'Warning',
    critical: 'Critical / Blocked',
    accessibilityRoutes: 'Accessibility Routes',
    wheelchairRoute: 'Wheelchair Route',
    elevatorLift: 'Elevator Lift',
  },
  es: {
    twinTitle: 'Gemelo Digital Interactivo del Estadio (Mapa Esquemático)',
    normal: 'Normal',
    warning: 'Advertencia',
    critical: 'Crítico / Bloqueado',
    accessibilityRoutes: 'Rutas de Accesibilidad',
    wheelchairRoute: 'Ruta de Silla de Ruedas',
    elevatorLift: 'Ascensor / Elevador',
  },
  fr: {
    twinTitle: 'Jumeau Numérique Interactif du Stade (Carte Schématique)',
    normal: 'Normal',
    warning: 'Avertissement',
    critical: 'Critique / Bloqué',
    accessibilityRoutes: "Itinéraires d'Accessibilité",
    wheelchairRoute: 'Itinéraire Fauteuil Roulant',
    elevatorLift: 'Ascenseur',
  },
};
export type SupportedLanguages = 'en' | 'es' | 'fr';
export type MapStrings = typeof MAP_TRANSLATIONS.en;
