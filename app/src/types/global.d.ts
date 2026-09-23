export {};

declare global {
  interface Window {
    ReactiveGemSystem?: {
      cuts: Record<string, unknown>;
      prepare(sources: Record<string, string>): void;
      renderPreviewCanvas(
        cut: string,
        color: string,
        tier?: number,
        size?: number,
        palette?: unknown,
        lightAngleOverride?: number | null
      ): HTMLCanvasElement;
      renderPreviewCanvasSized?(
        cut: string,
        color: string,
        width?: number,
        height?: number,
        palette?: unknown,
        lightAngleOverride?: number | null
      ): HTMLCanvasElement;
      collisionShape(
        cut: string,
        radius: number
      ): { type: 'circle'; radius: number } | { type: 'polygon'; vertices: Array<{x:number;y:number}> } | null;
      visualScale?(cut: string): number;
      isStepCut?(cut: string): boolean;
    };
    GemdropMeta?: {
      onMerge(tier: number, chain: number, options?: Record<string, unknown>): { chestGain?: number } | null;
      recordRun(summary: Record<string, number>): unknown;
      getProgressSnapshot(): unknown;
      getChestTarget(): number;
      getGemCount(tier: number): number;
      updateGemBadges(): void;
      showCollection(tab?: 'gems' | 'treasures'): void;
      selectCollectionTab(tab: 'gems' | 'treasures'): void;
      renderTreasureCollection(): void;
      openTreasureDetail(id: string, copyUid?: string | null): void;
      getTreasureInfo?(id: string): {id:string;name:string;rarity:string;art:string|null}|null;
      getState(): unknown;
    };
    GemdropGameScene?: {
      running: boolean;
      unlockedTiers: Set<number>;
      setMetaPaused(value: boolean): void;
      noteTreasureClaim(id: string): void;
    };
    lucide?: {
      createIcons(options?: unknown): void;
    };
  }
}
