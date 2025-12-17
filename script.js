/**
 * 健康スタジオ百歳製造所 正月クーポンサイト
 * 新春おみくじロジック - Wa-Modern Edition
 */

const FORTUNES = [
    {
        name: '大吉',
        probability: 0.10,
        coupon: '<span class="coupon-target">初回セッション</span><br><span class="coupon-amount">半額</span><div class="coupon-expiry">有効期限：2026年2月末日まで</div>',
        code: 'DAIKICHI_50',
        message: '天晴れ！最高の1年の始まりです！',
        class: 'daikichi'
    },
    {
        name: '中吉',
        probability: 0.20,
        coupon: '<span class="coupon-target">全セッション対象</span><br><span class="coupon-amount">1,000円 OFF</span><div class="coupon-expiry">有効期限：2026年2月末日まで</div>',
        code: 'CHUKICHI_1000',
        message: '運気上昇中！良いことがありそう。',
        class: 'chukichi'
    },
    {
        name: '小吉',
        probability: 0.35,
        coupon: '<span class="coupon-target">全セッション対象</span><br><span class="coupon-amount">500円 OFF</span><div class="coupon-expiry">有効期限：2026年2月末日まで</div>',
        code: 'SHOKICHI_500',
        message: 'ささやかな幸せが訪れるかも？',
        class: 'shokichi'
    },
    {
        name: '吉',
        probability: 0.35,
        coupon: '<span class="coupon-target">全セッション対象</span><br><span class="coupon-amount">300円 OFF</span><div class="coupon-expiry">有効期限：2026年2月末日まで</div>',
        code: 'KICHI_300',
        message: '堅実な一歩を踏み出しましょう。',
        class: 'kichi'
    }
];

// DOM Elements
const omikujiBox = document.getElementById('omikujiBox');
const drawButton = document.getElementById('drawButton');
const modalOverlay = document.getElementById('modalOverlay');
const modalClose = document.getElementById('modalClose');
const fortuneResult = document.getElementById('fortuneResult');
const couponMessage = document.getElementById('couponMessage');
const couponValue = document.getElementById('couponValue');
const couponCode = document.getElementById('couponCode');
const saveButton = document.getElementById('saveButton');
const confettiContainer = document.getElementById('confettiContainer');

// CONFIG
const ENABLE_ONE_TIME_LIMIT = false;

// --- Sound Synthesizer (Web Audio API) ---
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

const Sound = {
    // 1. Shake Sound (Filtered Noise)
    playShake: () => {
        const t = audioCtx.currentTime;
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        const filter = audioCtx.createBiquadFilter();

        // White noise buffer would be better, but using simple erratic osc for "rattle"
        // Actually, let's use multiple oscillators for a wooden rattle sound
        [100, 150, 200].forEach((freq, i) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.index = i;
            osc.type = 'square';
            osc.frequency.setValueAtTime(freq, t);
            osc.frequency.exponentialRampToValueAtTime(freq / 2, t + 0.1);

            gain.gain.setValueAtTime(0.1, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(t);
            osc.stop(t + 0.1);
        });
    },

    // 2. Charge Sound (Rising Pitch)
    playCharge: () => {
        const t = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, t);
        osc.frequency.exponentialRampToValueAtTime(800, t + 2.0); // Rise over 2s

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.2, t + 1.8);
        gain.gain.linearRampToValueAtTime(0, t + 2.0);

        // Add tremolo
        const lfo = audioCtx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 15;
        const lfoGain = audioCtx.createGain();
        lfoGain.gain.value = 500;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        lfo.start(t);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(t);
        osc.stop(t + 2.0);
    },

    // 3. Fanfare (Festive for ALL)
    playFanfare: (type) => {
        const t = audioCtx.currentTime;
        let notes = [];
        let typeOsc = 'triangle'; // Brighter "Trumpet" like sound for everyone
        let duration = 1.2;
        let stagger = 0.08;

        // "Pan-Pa-Ka-Paan!" vibe
        switch (type) {
            case '大吉':
                // SUPER FESTIVE: Double Arpeggio High
                // G3, C4, E4, G4, C5, E5, G5, C6!!
                notes = [392.00, 523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98, 2093.00];
                duration = 3.5;
                stagger = 0.06;
                break;
            default:
                // FESTIVE COMMON: Major Fanfare
                // Sol, Do, Mi, Sol, Do! (G3, C4, E4, G4, C5)
                notes = [392.00, 523.25, 659.25, 783.99, 1046.50];
                duration = 1.5;
                stagger = 0.06;
                break;
        }

        notes.forEach((freq, i) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();

            osc.type = typeOsc;
            osc.frequency.value = freq;

            const start = t + i * stagger;

            gain.gain.setValueAtTime(0, start);
            gain.gain.linearRampToValueAtTime(0.2, start + 0.05); // Sharp attack
            gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(start);
            osc.stop(start + duration);
        });
    },

    // 4. Pop Sound
    playPop: () => {
        const t = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.frequency.setValueAtTime(400, t);
        osc.frequency.exponentialRampToValueAtTime(1200, t + 0.1);
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.1);
    },

    // 5. Fail Sound (Gloomy)
    playFail: () => {
        const t = audioCtx.currentTime;
        const notes = [200, 180, 150]; // Descending, dissonance

        notes.forEach((freq, i) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();

            osc.index = i;
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, t + i * 0.4);
            osc.frequency.linearRampToValueAtTime(freq - 20, t + i * 0.4 + 0.5); // Pitch slide down

            gain.gain.setValueAtTime(0, t + i * 0.4);
            gain.gain.linearRampToValueAtTime(0.1, t + i * 0.4 + 0.1);
            gain.gain.linearRampToValueAtTime(0, t + i * 0.4 + 0.6);

            // Add Lowpass filter to make it muffled
            const filter = audioCtx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 300;

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(audioCtx.destination);

            osc.start(t + i * 0.4);
            osc.stop(t + i * 0.4 + 0.6);
        });
    }
};

let isDrawing = false;
let storedFortune = null;
const MAX_DRAWS = 3;

// Initialize: Check LocalStorage
function checkHistory() {
    // With 3-strike logic, we don't block immediately on load unless max reached
    /*
    const history = localStorage.getItem('omikuji_result_2025');
    if (history) {
        storedFortune = JSON.parse(history);
        drawButton.querySelector('.button-text').textContent = '結果を確認する';
        drawButton.classList.add('drawn');
    }
    */
    // Check if max draws reached (3 times)
    const count = parseInt(localStorage.getItem('omikuji_count_2026') || '0');
    if (count >= MAX_DRAWS) {
        const history = localStorage.getItem('omikuji_result_2026');
        if (history) {
            const raw = JSON.parse(history);
            // Refresh data from constant to ensure latest HTML/Text updates (like Expiry) are shown
            // instead of the stale JSON data from storage
            storedFortune = FORTUNES.find(f => f.name === raw.name) || raw;

            drawButton.querySelector('.button-text').textContent = '結果を確認する';
            drawButton.classList.add('drawn');
        }
    }
}
checkHistory();

// Drawing Logic
function drawFortune() {
    // 3-Strike Logic:
    // 1st time (count=0) -> Fail
    // 2nd time (count=1) -> Fail
    // 3rd time (count=2) -> Win (Random or guaranteed win)

    // Check current count
    let count = parseInt(localStorage.getItem('omikuji_count_2026') || '0');

    // Increment happens AFTER showing result, but for logic deciding:

    if (count < 2) {
        // Return 'Kyo' (Fail)
        return {
            name: '凶',
            probability: 0,
            coupon: '次回こそ...！',
            code: 'RETRY_LUCK',
            message: '残念はずれです。次こそ当たるはず！',
            class: 'kyo'
        };
    }

    // 3rd time (or more if unlimited for debug): Normal Random
    const random = Math.random();
    let cumulativeProbability = 0;
    for (const fortune of FORTUNES) {
        cumulativeProbability += fortune.probability;
        if (random <= cumulativeProbability) return fortune;
    }
    return FORTUNES[FORTUNES.length - 1];
}

// Simple Box Shake Animation
function shakeBox() {
    return new Promise((resolve) => {
        omikujiBox.classList.add('shaking');

        // Haptic Feedback
        if (navigator.vibrate) navigator.vibrate([50, 50, 50]);

        setTimeout(() => {
            omikujiBox.classList.remove('shaking');
            if (navigator.vibrate) navigator.vibrate(100);
            resolve();
        }, 1500);
    });
}

// Elegant Confetti using canvas-confetti
function triggerConfetti(type) {
    const duration = 3000;
    const end = Date.now() + duration;

    // Default colors
    let colors = ['#D9333F', '#C5A059', '#FFFFFF'];

    // Config based on fortune type
    let particleCount = 2;
    if (type === '大吉') particleCount = 5;
    if (type === '凶') return; // No confetti for Kyo

    (function frame() {
        confetti({
            particleCount: particleCount,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: colors
        });
        confetti({
            particleCount: particleCount,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: colors
        });

        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    }());
}

// Show Result with Animation
function showResult(fortune) {
    const isFail = (fortune.name === '凶');

    // Sound
    if (isFail) {
        Sound.playFail();
    } else {
        Sound.playFanfare(fortune.name);
    }

    fortuneResult.className = 'fortune-result ' + fortune.class;
    // Reset animation
    fortuneResult.style.animation = 'none';
    fortuneResult.offsetHeight; /* trigger reflow */
    fortuneResult.style.animation = 'popIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards';

    fortuneResult.querySelector('.fortune-text').textContent = fortune.name;
    couponMessage.textContent = fortune.message;
    couponValue.innerHTML = fortune.coupon; // Changed from textContent to innerHTML
    couponCode.textContent = isFail ? '' : fortune.code; // No code for fail

    if (isFail) {
        // Delay slighty to let the user process the "Shock" of the transition from Gold to Dark
        modalOverlay.classList.add('active', 'gloomy');

        // Hide Save Button / Usage info for Fail?
        if (saveButton) saveButton.style.display = 'none';

    } else {
        modalOverlay.classList.remove('gloomy');
        modalOverlay.classList.add('active');
        if (saveButton) saveButton.style.display = 'block'; // Show if it was hidden

        // Trigger Confetti for wins
        setTimeout(() => triggerConfetti(fortune.name), 300);

        // Save Result (Only wins count as "Result" to keep?)
        // Or store last result? 
        localStorage.setItem('omikuji_result_2026', JSON.stringify(fortune));
        storedFortune = fortune;
    }

    // Increment count
    let count = parseInt(localStorage.getItem('omikuji_count_2026') || '0');
    count++;
    localStorage.setItem('omikuji_count_2026', count.toString());

    // Update Button State
    if (count < MAX_DRAWS) {
        drawButton.querySelector('.button-text').textContent = `もう一度引く (あと${MAX_DRAWS - count}回)`;
        drawButton.classList.remove('drawn');
        // Close modal automatically or let user close? 
        // Let user close.
    } else {
        // Reached limit
        drawButton.querySelector('.button-text').textContent = '結果を確認する';
        drawButton.classList.add('drawn');
    }
}

function closeModal() {
    modalOverlay.classList.remove('active', 'gloomy');
    isDrawing = false;
}

// Violet Box Shake Animation (Confirmation Effect)
function shakeBoxViolent() {
    return new Promise((resolve) => {
        omikujiBox.classList.add('shaking-violent');
        Sound.playCharge(); // Play Charge Sound

        // Intense Haptic
        if (navigator.vibrate) navigator.vibrate([100, 30, 100, 30, 100]);

        setTimeout(() => {
            omikujiBox.classList.remove('shaking-violent');
            resolve();
        }, 2000); // 2 seconds of intensity
    });
}

// Event Listeners
drawButton.addEventListener('click', () => startOmikuji());

async function startOmikuji(forcedType = null) {
    if (isDrawing) return;

    // Resume AudioContext on first interaction
    if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
    }

    // Check Limit
    const count = parseInt(localStorage.getItem('omikuji_count_2025') || '0');

    // If finished (3 times done) and we have a result, just show it
    if (count >= MAX_DRAWS && storedFortune && !forcedType) {
        showResult(storedFortune);
        return;
    }

    isDrawing = true;

    // UI Update
    const originalText = drawButton.querySelector('.button-text').textContent;
    drawButton.querySelector('.button-text').textContent = '詠唱中...';
    drawButton.disabled = true;

    let fortune;
    if (forcedType) {
        if (forcedType === '凶') {
            fortune = {
                name: '凶',
                probability: 0,
                coupon: '次回こそ...！',
                code: 'RETRY_LUCK',
                message: '残念はずれです。次こそ当たるはず！',
                class: 'kyo'
            };
        } else {
            fortune = FORTUNES.find(f => f.name === forcedType);
        }
    } else {
        fortune = drawFortune();
    }

    // 1. Normal Shake with Rattle Sound
    // Repeat rattle sound a few times during shake
    const rattleInterval = setInterval(() => Sound.playShake(), 200);
    await shakeBox();
    clearInterval(rattleInterval);

    // 2. Kakutei Enshutsu (Confirmation Effect) 
    // Trigger for Daikichi (Real) AND Kyo (Fake-out/Near Miss)
    if (fortune.name === '大吉' || fortune.name === '凶') {
        Sound.playPop(); // Alert sound
        // Brief pause for suspense
        await new Promise(r => setTimeout(r, 500));

        // Change text to hint at something...
        drawButton.querySelector('.button-text').textContent = '！？';

        // Violent Shake (Looks like a Win!)
        await shakeBoxViolent();
    }

    showResult(fortune);

    // Reset
    drawButton.disabled = false;
    // Text update handled in showResult
}

// DEBUG FUNCTIONS (Global)
window.debugDraw = (type) => {
    // Force reset state if needed
    isDrawing = false;
    startOmikuji(type);
};

window.resetHistory = () => {
    localStorage.removeItem('omikuji_result_2026');
    localStorage.removeItem('omikuji_count_2026'); // Clear count too
    storedFortune = null;
    drawButton.querySelector('.button-text').textContent = 'おみくじを引く';
    drawButton.classList.remove('drawn');
    alert('履歴をリセットしました');
};

// Save Coupon Logic
// Save Coupon Logic
saveButton.addEventListener('click', () => {
    // 1. Target the modal
    const target = document.getElementById('resultModal');

    // 2. Use html2canvas with onclone to manipulate the capture state WITHOUT affecting the real DOM
    html2canvas(target, {
        backgroundColor: '#FFFFFF', // Clean white background
        scale: 3, // High quality
        useCORS: true,
        logging: false,
        allowTaint: true,
        // Important: Reset scroll to ensure full capture
        scrollX: 0,
        scrollY: 0,
        windowWidth: document.documentElement.offsetWidth,
        windowHeight: document.documentElement.offsetHeight,

        onclone: (clonedDoc) => {
            const clonedModal = clonedDoc.getElementById('resultModal');
            const clonedBody = clonedModal.querySelector('.modal-body');

            // A. Clean up Styles for "Card" look
            clonedModal.style.transform = 'none';
            clonedModal.style.position = 'relative';
            clonedModal.style.margin = '0';
            clonedModal.style.boxShadow = 'none';
            clonedModal.style.borderRadius = '0';
            clonedModal.style.overflow = 'visible'; // Show full content
            clonedModal.style.height = 'auto';
            clonedModal.style.maxHeight = 'none';
            clonedModal.style.background = '#FFFFFF'; // Force opaque white
            clonedModal.style.border = '20px solid #FFFFFF'; // Add padding border

            // B. HIDE unnecessary elements in the clone
            const elementsToHide = [
                'modalCloseIcon', // X button
                'saveButton',     // The save button itself
                'modalClose',     // Bottom close button
            ];

            // Hide by ID
            elementsToHide.forEach(id => {
                const el = clonedDoc.getElementById(id);
                if (el) el.style.display = 'none';
            });

            // Hide specific blocks by class/structure
            // We want to hide "Warning Box", "How to Use", "Usage Note"
            // Keep: .modal-header, .fortune-result, .coupon-info

            const warningBox = clonedModal.querySelector('.warning-box');
            if (warningBox) warningBox.style.display = 'none';

            const howToUse = clonedModal.querySelector('.how-to-use');
            if (howToUse) howToUse.style.display = 'none';

            const usageNote = clonedModal.querySelector('.usage-note');
            if (usageNote) usageNote.style.display = 'none';

            // Remove footer wrapper if it exists
            const footer = clonedModal.querySelector('.modal-footer');
            if (footer) footer.style.display = 'none';

            // C. Add Phone Number to the Coupon Image (User Request)
            // Create a new element and append it to the cloned body
            const phoneInfo = clonedDoc.createElement('div');
            phoneInfo.style.marginTop = '1.5rem';
            phoneInfo.style.textAlign = 'center';
            phoneInfo.style.color = '#333';
            phoneInfo.style.fontSize = '0.9rem';
            phoneInfo.style.fontWeight = 'bold';
            phoneInfo.style.borderTop = '1px solid #eee';
            phoneInfo.style.paddingTop = '1rem';
            phoneInfo.innerHTML = 'ご予約・お問い合わせ<br><span style="font-size: 1.2rem; color: #000;">TEL: 080-6122-7551</span>';

            clonedBody.appendChild(phoneInfo);

        }
    }).then(canvas => {
        // Download
        const link = document.createElement('a');
        link.download = `omikuji_coupon_${storedFortune ? storedFortune.code : 'win'}_2026.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    }).catch(err => {
        console.error('Capture failed:', err);
        alert('画像の保存に失敗しました。もう一度お試しください。');
    });
});



modalClose.addEventListener('click', closeModal);
document.getElementById('modalCloseIcon').addEventListener('click', closeModal);
omikujiBox.addEventListener('click', () => !isDrawing && drawButton.click());
