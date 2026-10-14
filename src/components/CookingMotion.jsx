
import { useEffect, useState } from "react";
import "./CookingMotion.css";

const TOTAL_SCENES = 5;
const SCENE_DURATION = 5000;

function CookingMotion() {
  const [activeScene, setActiveScene] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

    useEffect(() => {
        let transitionTimeout;

        const interval = setInterval(() => {
            // Fade out current animation
            setIsTransitioning(true);

            transitionTimeout = setTimeout(() => {
                // Switch scene after fade-out
                setActiveScene((previous) => (
                    previous + 1
                ) % TOTAL_SCENES);

                // Fade in next animation
                setIsTransitioning(false);
            }, 450);

        }, SCENE_DURATION);

        return () => {
            clearInterval(interval);
            clearTimeout(transitionTimeout);
        };
    }, []);

  return (
    <div
      className="cm-scene"
      aria-label="Decorative cooking animations"
    >
          <div
              className={`cm-animation ${isTransitioning ? "cm-fade-out" : "cm-fade-in"
                  }`}
              key={activeScene}
              aria-hidden="true"
          >
        {/* 1 — CHOPPING VEGETABLES */}
        {activeScene === 0 && (
          <div className="cm-chopping">
            <span className="cm-chop-board" />
            <span className="cm-chop-carrot">🥕</span>
            <span className="cm-chop-knife">🔪</span>
            <span className="cm-chop-piece cm-piece-one">🥕</span>
            <span className="cm-chop-piece cm-piece-two">🥕</span>
          </div>
        )}

        {/* 2 — WOK TOSSING */}
        {activeScene === 1 && (
          <div className="cm-wok-scene">
            <span className="cm-wok">🥘</span>
            <span className="cm-steam cm-steam-one">♨</span>
            <span className="cm-steam cm-steam-two">♨</span>
            <span className="cm-ingredient cm-veg-one">🥕</span>
            <span className="cm-ingredient cm-veg-two">🥬</span>
            <span className="cm-ingredient cm-veg-three">🍅</span>
          </div>
        )}

        {/* 3 — BURGER ASSEMBLY */}
        {activeScene === 2 && (
          <div className="cm-burger-scene">
            <span className="cm-burger-bottom" />
            <span className="cm-burger-patty" />
            <span className="cm-burger-cheese" />
            <span className="cm-burger-lettuce" />
            <span className="cm-burger-top" />
          </div>
        )}

        {/* 4 — PLATING */}
        {activeScene === 3 && (
          <div className="cm-plating-scene">
            <span className="cm-plate">🍽️</span>
            <span className="cm-plated-food">🍜</span>
            <span className="cm-garnish cm-garnish-one">🌿</span>
            <span className="cm-garnish cm-garnish-two">✨</span>
          </div>
        )}

        {/* 5 — SERVING */}
        {activeScene === 4 && (
          <div className="cm-serving-scene">
            <span className="cm-serving-tray" />
            <span className="cm-serving-meal">🍱</span>
            <span className="cm-serving-sparkle">✨</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default CookingMotion;
