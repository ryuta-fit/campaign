/**
 * 健康スタジオ百歳製造所 正月クーポンサイト
 * 新春おみくじロジック - Wa-Modern Edition
 */

const FORTUNES = [
    {
        name: '大吉',
        probability: 0.10,
        coupon: '<span class="coupon-target">全セッション対象</span><br><span class="coupon-amount">1,500円 OFF</span><div class="coupon-expiry">有効期限：2026年2月末日まで</div>',
        code: 'DAIKICHI_1500',
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

// Sound Synthesizer (Web Audio API)
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

const Sound = {
    playShake: () => {
        const t = audioCtx.currentTime;
        [100, 150, 200].forEach((freq, i) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.index = i; osc.type = 'square';
            osc.frequency.setValueAtTime(freq, t);
            osc.frequency.exponentialRampToValueAtTime(freq / 2, t + 0.1);
            gain.gain.setValueAtTime(0.1, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
            osc.connect(gain); gain.connect(audioCtx.destination);
            osc.start(t); osc.stop(t + 0.1);
        });
    },
    playCharge: () => { // RESTORED
        const t = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, t);
        osc.frequency.exponentialRampToValueAtTime(800, t + 3.0); // 3.0s
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.2, t + 2.8);
        gain.gain.linearRampToValueAtTime(0, t + 3.0);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(t); osc.stop(t + 3.0);
    },
    playPop: () => { // RESTORED
        const t = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.frequency.setValueAtTime(400, t);
        osc.frequency.exponentialRampToValueAtTime(1200, t + 0.1);
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(t); osc.stop(t + 0.1);
    },
    playWin: () => { // ADDED MISSING FUNCTION
        Sound.playFanfare('大吉');
    },
    playFanfare: (type) => { // Generic Win Sound
        const t = audioCtx.currentTime;
        let notes = [392.00, 523.25, 659.25, 783.99, 1046.50];
        let duration = 1.5;
        if (type === '大吉') {
            notes = [392.00, 523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98, 2093.00];
            duration = 3.5;
        }
        notes.forEach((freq, i) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.value = freq;
            const start = t + i * 0.06;
            gain.gain.setValueAtTime(0, start);
            gain.gain.linearRampToValueAtTime(0.2, start + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
            osc.connect(gain); gain.connect(audioCtx.destination);
            osc.start(start); osc.stop(start + duration);
        });
    },
    playFail: () => {
        const t = audioCtx.currentTime;
        [200, 180, 150].forEach((freq, i) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, t + i * 0.4);
            osc.frequency.linearRampToValueAtTime(freq - 20, t + i * 0.4 + 0.5);
            gain.gain.setValueAtTime(0, t + i * 0.4);
            gain.gain.linearRampToValueAtTime(0.1, t + i * 0.4 + 0.1);
            gain.gain.linearRampToValueAtTime(0, t + i * 0.4 + 0.6);
            osc.connect(gain); gain.connect(audioCtx.destination);
            osc.start(t + i * 0.4); osc.stop(t + i * 0.4 + 0.6);
        });
    },
    playTap: () => {
        const t = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.frequency.setValueAtTime(400, t);
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(t); osc.stop(t + 0.05);
    }
};

document.addEventListener('DOMContentLoaded', () => {

    const omikujiBox = document.getElementById('omikujiBox');
    const drawButton = document.getElementById('drawButton');
    const modalOverlay = document.getElementById('modalOverlay');
    const modalClose = document.getElementById('modalClose');
    const fortuneResult = document.getElementById('fortuneResult');
    const couponMessage = document.getElementById('couponMessage');
    const couponValue = document.getElementById('couponValue');
    const couponCode = document.getElementById('couponCode');
    const saveButton = document.getElementById('saveButton');

    let isDrawing = false;
    const MAX_DRAWS = 3;

    // Helper: Unlock Audio
    function unlockAudio() {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        document.removeEventListener('touchstart', unlockAudio);
        document.removeEventListener('click', unlockAudio);
    }
    document.addEventListener('touchstart', unlockAudio, { passive: true });
    document.addEventListener('click', unlockAudio, { passive: true });

    // Drawing Logic
    function drawFortune() {
        let count = parseInt(localStorage.getItem('omikuji_draw_count_2026') || '0');
        if (count < 2) { // 0, 1 -> Fail
            return {
                name: '凶',
                probability: 0,
                coupon: '次回こそ...！',
                code: 'RETRY_LUCK',
                message: '残念はずれです。次こそ当たるはず！',
                class: 'kyo'
            };
        }
        // Random Win
        const random = Math.random();
        let cumulative = 0;
        for (const fortune of FORTUNES) {
            cumulative += fortune.probability;
            if (random <= cumulative) return fortune;
        }
        return FORTUNES[FORTUNES.length - 1];
    }

    // Helper: Violet Shake
    function shakeBoxViolent() {
        return new Promise((resolve) => {
            omikujiBox.classList.add('shaking-violent');
            if (Sound.playCharge) Sound.playCharge();
            if (navigator.vibrate) navigator.vibrate([100, 30, 100, 30, 100]);
            setTimeout(() => {
                omikujiBox.classList.remove('shaking-violent');
                resolve();
            }, 3000); // Extended to 3s
        });
    }

    async function triggerDraw() {
        if (isDrawing) return;
        isDrawing = true;

        // Visuals
        drawButton.querySelector('.button-text').textContent = '詠唱中...';
        drawButton.disabled = true;

        // 1. Determine Result FIRST
        const fortune = drawFortune();

        // 2. Normal Shake (1.5s)
        const rattleInterval = setInterval(() => Sound.playShake(), 200);
        omikujiBox.classList.add('shaking');
        await new Promise(r => setTimeout(r, 1500));
        clearInterval(rattleInterval);
        omikujiBox.classList.remove('shaking');

        // 3. Suspense / Confirmation Logic (Kakutei Enshutsu)
        // If Daikichi OR Kyo, do the "Suspense" animation
        if (fortune.name === '大吉' || fortune.name === '凶') {
            if (Sound.playPop) Sound.playPop();
            await new Promise(r => setTimeout(r, 1000)); // Pause (Increased)

            drawButton.querySelector('.button-text').textContent = '！？';
            await shakeBoxViolent(); // 3s Violent Shake

            // Final Silence
            await new Promise(r => setTimeout(r, 800));
        }

        // 4. Show Result
        isDrawing = false;
        drawButton.disabled = false;

        // Increment Count
        let count = parseInt(localStorage.getItem('omikuji_draw_count_2026') || '0');
        count++;
        localStorage.setItem('omikuji_draw_count_2026', count.toString());

        showResult(fortune);
    }

    function showResult(fortune) {
        // --- 1. Sound & Animation ---
        if (fortune.class === 'kyo') {
            Sound.playFail();
        } else {
            Sound.playWin();
            // Save Result PERMANENTLY on Win
            localStorage.setItem('omikuji_result_2026', JSON.stringify(fortune));

            // Confetti
            if (typeof confetti !== 'undefined') {
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#FFD700', '#FF0000', '#FFFFFF']
                });
            }
        }

        // --- 2. Update Content ---
        fortuneResult.className = 'fortune-result ' + fortune.class;
        // Fix: Use querySelector for child element or correct ID
        const textEl = fortuneResult.querySelector('.fortune-text');
        if (textEl) textEl.textContent = fortune.name;

        // Fix: Use correct ID (couponMessage)
        if (couponMessage) couponMessage.textContent = fortune.message;

        couponValue.innerHTML = fortune.coupon;
        couponCode.textContent = (fortune.class === 'kyo') ? '' : fortune.code;

        // --- 3. Toggle UI Elements (Win vs Kyo) ---
        const couponContent = document.getElementById('couponContent');
        const kyoContent = document.getElementById('kyoContent');
        const retryBtn = document.getElementById('retryButton');
        const warningBox = document.querySelector('.warning-box');
        const howToUse = document.querySelector('.how-to-use');
        const usageNotes = document.querySelector('.usage-notes');

        if (fortune.class === 'kyo') {
            // Fail UI
            couponContent.style.display = 'none';
            kyoContent.style.display = 'block';
            if (saveButton) saveButton.style.display = 'none';
            if (warningBox) warningBox.style.display = 'none';
            if (howToUse) howToUse.style.display = 'none';
            if (usageNotes) usageNotes.style.display = 'none';
            if (retryBtn) {
                retryBtn.style.display = 'inline-block';
                retryBtn.onclick = () => { closeModal(); setTimeout(triggerDraw, 500); };
            }
        } else {
            // Win UI
            couponContent.style.display = 'block';
            kyoContent.style.display = 'none';
            if (saveButton) saveButton.style.display = 'block';
            if (warningBox) warningBox.style.display = 'block';
            if (howToUse) howToUse.style.display = 'block';
            if (usageNotes) usageNotes.style.display = 'block';
            if (retryBtn) retryBtn.style.display = 'none';

            // Update Button to "Check"
            drawButton.textContent = 'クーポンを確認する';
            drawButton.onclick = () => showResult(fortune); // Reset handler
        }

        // Show Modal
        modalOverlay.classList.add('active');
    }

    function closeModal() {
        modalOverlay.classList.remove('active');
    }

    // --- Init ---
    function init() {
        const savedResult = localStorage.getItem('omikuji_result_2026');
        if (savedResult) {
            // Restore Win State
            const fortune = JSON.parse(savedResult);
            drawButton.textContent = 'クーポンを確認する';
            drawButton.onclick = () => { Sound.playTap(); showResult(fortune); };
        } else {
            // Fresh State
            drawButton.onclick = triggerDraw; // Use onclick property for cleaner override later
        }

        modalClose.addEventListener('click', closeModal);
        const footerClose = document.getElementById('modalCloseBtn');
        if (footerClose) footerClose.addEventListener('click', closeModal);

        // Fix: Add listener for Top Right X Icon
        const closeIcon = document.getElementById('modalCloseIcon');
        if (closeIcon) closeIcon.addEventListener('click', closeModal);
    }

    // --- Start ---
    init();

    // Box Click Override
    omikujiBox.addEventListener('click', () => {
        if (!isDrawing) drawButton.click();
    });

    // --- Save Logic Removed ---
    // User requested removal of the Save Coupon button.
    // Logic deleted.

    // Debug
    window.debugForceWin = () => showResult(FORTUNES[0]);
    window.resetDebug = () => { localStorage.clear(); location.reload(); };

});
