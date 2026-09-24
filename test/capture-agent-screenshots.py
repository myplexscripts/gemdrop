import os
import time
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

ROOT = "http://127.0.0.1:8000"
OUT = Path("screenshots")
OUT.mkdir(exist_ok=True)

def make_driver():
    options = webdriver.ChromeOptions()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument("--hide-scrollbars")
    options.add_argument("--window-size=390,844")
    options.add_argument("--force-device-scale-factor=1")
    options.add_argument("--autoplay-policy=no-user-gesture-required")
    driver = webdriver.Chrome(options=options)
    driver.set_window_size(390, 844)
    return driver

def load_game(driver):
    driver.get(ROOT + "/index.html")
    WebDriverWait(driver, 20).until(
        lambda d: d.execute_script("return !!window.GemdropGameScene && !!window.Phaser")
    )
    WebDriverWait(driver, 20).until(
        EC.element_to_be_clickable((By.ID, "startButton"))
    ).click()
    WebDriverWait(driver, 10).until(
        lambda d: d.execute_script("return window.GemdropGameScene && window.GemdropGameScene.running")
    )
    driver.execute_script("return document.fonts && document.fonts.ready")
    time.sleep(0.45)

def save(driver, name):
    driver.save_screenshot(str(OUT / name))

def danger_sequence(driver):
    load_game(driver)
    driver.execute_script("""
      const s=window.GemdropGameScene;
      s.clearRun();
      s.running=true;
      s.ready=false;
      s.paused=false;
      s.metaPaused=false;
      s.dangerTime=0;
      s.matter.world.resume();
      s.destroyPreview();
      const M=Phaser.Physics.Matter.Matter;
      const gems=[
        s.createGem(160,145,12),
        s.createGem(310,150,11),
        s.createGem(235,205,10)
      ];
      gems.forEach(g=>{
        M.Body.setStatic(g.body,true);
        g.born=s.time.now-1200;
      });
    """)
    time.sleep(0.55)
    save(driver, "01-danger-failsafe.png")

def special_gem(driver):
    driver.get(ROOT + "/index.html")
    load_game(driver)
    driver.execute_script("""
      const s=window.GemdropGameScene;
      s.clearRun();
      s.running=true;
      s.ready=false;
      s.paused=false;
      s.metaPaused=false;
      s.matter.world.resume();
      s.destroyPreview();
      const M=Phaser.Physics.Matter.Matter;
      const regular=[
        s.createGem(120,680,4),
        s.createGem(250,700,6),
        s.createGem(355,670,3)
      ];
      regular.forEach(g=>M.Body.setStatic(g.body,true));
      const special=s.createGem(320,330,9,'fusion');
      M.Body.setStatic(special.body,true);
      special.born=s.time.now-1000;
      s.showStatus('FUSION GEM','reward',0,'sparkles');
    """)
    time.sleep(0.9)
    save(driver, "02-prismatic-special-gem.png")

def high_tier_merge(driver):
    driver.get(ROOT + "/index.html")
    load_game(driver)
    driver.execute_script("""
      const s=window.GemdropGameScene;
      s.clearRun();
      s.running=true;
      s.ready=false;
      s.paused=false;
      s.metaPaused=false;
      s.matter.world.resume();
      s.destroyPreview();
      const a=s.createGem(275,420,14);
      const b=s.createGem(365,420,14);
      s.queueMerge(a,b);
      s.processMerges();
    """)
    time.sleep(0.16)
    save(driver, "03-high-tier-merge.png")

def run_summary(driver):
    driver.get(ROOT + "/index.html")
    load_game(driver)
    driver.execute_script("""
      const s=window.GemdropGameScene;
      s.running=false;
      s.ready=false;
      s.runStartedAt=performance.now()-145000;
      s.runPausedTotal=0;
      s.runPauseStartedAt=0;
      s.runMerges=84;
      s.runBestChain=6;
      s.bestTierReached=12;
      s.score=5620;
      s.runGemGains=Array(20).fill(0);
      s.runGemGains[5]=3;
      s.runGemGains[9]=2;
      s.runGemGains[12]=1;
      s.runStartUnlocked=new Set([0,1,2,3,4,5,6,7,8]);
      s.unlockedTiers=new Set([0,1,2,3,4,5,6,7,8,9,10,11,12]);
      s.runStartTreasures=new Set(['silver-ring']);
      s.runTreasureClaims=['sun-brooch'];

      const state=window.GemdropMeta.getState();
      state.discoveredTreasures=['silver-ring','sun-brooch'];

      document.getElementById('finalScore').textContent='$5,620';
      document.getElementById('bestMerge').textContent='Tanzanite';
      s.renderRunSummary();

      document.getElementById('startOverlay').classList.remove('visible');
      document.getElementById('gameOverOverlay').classList.add('visible');
      if(window.lucide) window.lucide.createIcons({attrs:{'stroke-width':1.9}});
    """)
    time.sleep(0.35)
    save(driver, "04-run-progression-summary.png")

def main():
    driver=make_driver()
    try:
        danger_sequence(driver)
        special_gem(driver)
        high_tier_merge(driver)
        run_summary(driver)
    finally:
        driver.quit()

if __name__ == "__main__":
    main()
