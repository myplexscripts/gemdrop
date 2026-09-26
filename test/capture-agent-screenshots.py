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
    driver.execute_script("localStorage.setItem('gemdrop-tutorial-seen-v1','1')")
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
    time.sleep(1.0)
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
    time.sleep(0.08)
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

def performance_stress(driver):
    driver.get(ROOT + "/index.html")
    load_game(driver)
    result=driver.execute_script("""
      const s=window.GemdropGameScene;
      return s.runStressScenario();
    """)
    time.sleep(2.5)

    stats=driver.execute_script("""
      const s=window.GemdropGameScene;
      const invalid=s.gems.filter(g=>
        !g || !g.active || !g.body ||
        !Number.isFinite(g.x) || !Number.isFinite(g.y) ||
        !Number.isFinite(g.body.velocity.x) || !Number.isFinite(g.body.velocity.y)
      ).length;
      return {
        running:s.running,
        gems:s.gems.length,
        transientFx:s.transientFx.size,
        invalid
      };
    """)

    assert result["cap"] == 140
    assert stats["running"] is True
    assert stats["transientFx"] <= 140
    assert stats["invalid"] == 0
    save(driver, "05-performance-stress.png")

def orders_screen(driver):
    driver.get(ROOT + "/index.html")
    WebDriverWait(driver, 20).until(
        lambda d: d.execute_script("return !!window.GemdropGameScene && !!window.GemdropMeta")
    )
    WebDriverWait(driver, 20).until(
        EC.element_to_be_clickable((By.ID, "collectionButton"))
    ).click()
    WebDriverWait(driver, 10).until(
        EC.element_to_be_clickable((By.ID, "collectionTabOrders"))
    ).click()
    WebDriverWait(driver, 10).until(
        lambda d: d.execute_script("""
          const board=document.getElementById('orderBoard');
          return board && !board.hidden &&
            board.querySelectorAll('.order-card--current').length === 1 &&
            board.querySelectorAll('.order-treasure-goal').length === 1;
        """)
    )
    assert driver.execute_script("return document.getElementById('collectionTabOrders').getAttribute('aria-selected')") == "true"
    time.sleep(0.25)
    save(driver, "06-jeweller-orders.png")

def economy_loop(driver):
    driver.get(ROOT + "/index.html")
    load_game(driver)
    driver.execute_script("""
      const s=window.GemdropGameScene;
      const state=window.GemdropMeta.getState();
      state.gold=0;
      state.ordersCompleted=0;
      state.orderSequence=999;
      state.orders=[{
        id:'test-order',
        number:999,
        slot:0,
        kind:'gems',
        requirements:[{tier:0,qty:1}],
        reward:123,
        createdAt:Date.now()
      }];
      state.gemCounts=Array(20).fill(0);

      const M=Phaser.Physics.Matter.Matter;
      const gem=s.createGem(220,650,0);
      M.Body.setStatic(gem.body,true);
      gem.born=s.time.now-1000;
      s.dropGateGem=null;
      window.GemdropMeta.syncOrderUI();
    """)
    WebDriverWait(driver, 10).until(
        lambda d: d.execute_script("return document.getElementById('orderHud').classList.contains('ready')")
    )
    driver.find_element(By.ID, "orderHud").click()
    WebDriverWait(driver, 10).until(
        lambda d: d.execute_script("return window.GemdropMeta.getState().ordersCompleted === 1")
    )
    result=driver.execute_script("""
      const state=window.GemdropMeta.getState();
      const before=state.gemCounts.reduce((a,b)=>a+b,0);
      window.GemdropMeta.onMerge(0,1,{resultTier:1});
      const after=state.gemCounts.reduce((a,b)=>a+b,0);
      return {
        gold:state.gold,
        before,
        after,
        quartzOnBoard:window.GemdropGameScene.getDeliverableGemCounts()[0]
      };
    """)
    assert result["gold"] == 123
    assert result["before"] == 0
    assert result["after"] == 0
    assert result["quartzOnBoard"] == 0

def tutorial_screen(driver):
    driver.get(ROOT + "/index.html")
    WebDriverWait(driver, 20).until(
        lambda d: d.execute_script("return !!window.GemdropGameScene")
    )
    driver.execute_script("localStorage.removeItem('gemdrop-tutorial-seen-v1')")
    driver.refresh()
    WebDriverWait(driver, 20).until(
        lambda d: d.execute_script("return !!window.GemdropGameScene")
    )
    WebDriverWait(driver, 20).until(
        EC.element_to_be_clickable((By.ID, "startButton"))
    ).click()
    WebDriverWait(driver, 10).until(
        lambda d: "visible" in d.find_element(By.ID, "tutorialOverlay").get_attribute("class")
    )
    time.sleep(0.25)
    save(driver, "07-first-run-tutorial.png")

def main():
    driver=make_driver()
    try:
        danger_sequence(driver)
        special_gem(driver)
        high_tier_merge(driver)
        run_summary(driver)
        performance_stress(driver)
        orders_screen(driver)
        economy_loop(driver)
        tutorial_screen(driver)
    finally:
        driver.quit()

if __name__ == "__main__":
    main()
