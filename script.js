const canvas = document.getElementById('flowerCanvas');
const ctx = canvas.getContext('2d');
const messageContainer = document.getElementById('messageContainer');

let width, height;
let flowers = [];
let fallingPetals = [];
let fireflies = [];
let clicked = false;

function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
}

window.addEventListener('resize', resize);
resize();

class Flower {
    constructor(x, targetHeight, scale) {
        this.baseX = x;
        this.x = x;
        this.y = height;
        this.targetY = height - targetHeight;
        this.currentY = height;
        this.scale = scale;
        this.stemGrown = false;
        this.bloomProgress = 0;
        this.petals = [];
        this.numPetals = 16; // Cantidad de pétalos por flor
        this.swayOffset = Math.random() * Math.PI * 2;
        this.swaySpeed = 0.001 + Math.random() * 0.001;
        
        for (let i = 0; i < this.numPetals; i++) {
            this.petals.push({
                angle: (i / this.numPetals) * Math.PI * 2,
                attached: true,
                sizeOffset: Math.random() * 0.2 + 0.9 // Variación ligera en el tamaño del pétalo
            });
        }
    }

    update() {
        if (this.currentY > this.targetY) {
            // Crecimiento del tallo hacia arriba
            this.currentY -= 4;
        } else {
            this.stemGrown = true;
            if (this.bloomProgress < 1) {
                this.bloomProgress += 0.015; // Velocidad de floración
            }
        }

        // Efecto de balanceo con el viento
        if (this.stemGrown) {
            const time = Date.now();
            this.x = this.baseX + Math.sin(time * this.swaySpeed + this.swayOffset) * 25 * this.scale;
        }
    }

    draw() {
        // Tallo
        ctx.beginPath();
        ctx.moveTo(this.baseX, height);
        ctx.quadraticCurveTo(this.baseX, (height + this.currentY) / 2, this.x, this.currentY);
        ctx.strokeStyle = '#2e7d32'; // Verde oscuro elegante
        ctx.lineWidth = 8 * this.scale;
        ctx.lineCap = 'round';
        ctx.stroke();

        if (this.stemGrown) {
            // Función auxiliar para dibujar hojas
            const drawLeaf = (sideX, sideY, rot) => {
                ctx.save();
                ctx.translate(sideX, sideY);
                ctx.rotate(rot);
                ctx.beginPath();
                ctx.ellipse(20 * this.scale, 0, 25 * this.scale, 10 * this.scale, 0, 0, Math.PI * 2);
                ctx.fillStyle = '#388e3c';
                ctx.fill();
                ctx.restore();
            };
            
            // Dibujar un par de hojas en el tallo
            drawLeaf(this.baseX + (this.x - this.baseX)*0.3 - 5, height - (height - this.currentY)*0.4, Math.PI - 0.5);
            drawLeaf(this.baseX + (this.x - this.baseX)*0.6 + 5, height - (height - this.currentY)*0.6, 0.5);

            // Preparación de pétalos
            const maxPetalLength = 45 * this.scale;
            const maxPetalWidth = 15 * this.scale;
            
            this.petals.forEach(petal => {
                if (petal.attached) {
                    ctx.save();
                    ctx.translate(this.x, this.currentY);
                    ctx.rotate(petal.angle);
                    ctx.beginPath();
                    
                    const pLength = maxPetalLength * this.bloomProgress * petal.sizeOffset;
                    const pWidth = maxPetalWidth * this.bloomProgress * petal.sizeOffset;
                    
                    // Dibujar elipse del pétalo desde el centro hacia afuera
                    ctx.ellipse(pLength / 2, 0, pLength / 2, pWidth, 0, 0, Math.PI * 2);
                    
                    // Gradiente elegante de naranja/ámbar a amarillo
                    const gradient = ctx.createLinearGradient(0, 0, pLength, 0);
                    gradient.addColorStop(0, '#f57f17'); // Naranja en el centro
                    gradient.addColorStop(0.3, '#ffb300'); // Amarillo ámbar
                    gradient.addColorStop(1, '#ffee58'); // Amarillo claro en la punta
                    
                    ctx.fillStyle = gradient;
                    ctx.shadowColor = 'rgba(255, 235, 59, 0.4)';
                    ctx.shadowBlur = 8;
                    ctx.fill();
                    
                    // Línea central decorativa en el pétalo
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(pLength * 0.8, 0);
                    ctx.strokeStyle = 'rgba(245, 127, 23, 0.4)';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                    
                    ctx.restore();
                }
            });

            // Centro de la flor (girasol oscuro)
            ctx.beginPath();
            ctx.arc(this.x, this.currentY, 12 * this.scale * this.bloomProgress, 0, Math.PI * 2);
            const centerGrad = ctx.createRadialGradient(this.x, this.currentY, 0, this.x, this.currentY, 12 * this.scale);
            centerGrad.addColorStop(0, '#5d4037');
            centerGrad.addColorStop(1, '#3e2723');
            ctx.fillStyle = centerGrad;
            ctx.fill();
            
            // "Semillas" amarillas puntilladas en el centro
            ctx.fillStyle = '#ffb300';
            for(let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const r = 6 * this.scale * this.bloomProgress;
                ctx.beginPath();
                ctx.arc(this.x + Math.cos(angle)*r, this.currentY + Math.sin(angle)*r, 1.5 * this.scale, 0, Math.PI*2);
                ctx.fill();
            }
        }
    }

    shatter() {
        // Soltar entre 3 y 6 pétalos por clic para que la flor no se quede vacía de inmediato
        let petalsToDrop = Math.floor(Math.random() * 4) + 3;
        
        // Barajar array de índices para elegir pétalos aleatorios que aún estén pegados
        let indices = this.petals.map((_, i) => i).filter(i => this.petals[i].attached);
        indices.sort(() => Math.random() - 0.5);
        
        for(let i = 0; i < Math.min(petalsToDrop, indices.length); i++) {
            let petal = this.petals[indices[i]];
            petal.attached = false;
            
            // Distancia de inicio de caída separada un poco del centro
            const startDist = 20 * this.scale;
            
            fallingPetals.push({
                x: this.x + Math.cos(petal.angle) * startDist,
                y: this.currentY + Math.sin(petal.angle) * startDist,
                angle: petal.angle,
                scale: this.scale * petal.sizeOffset,
                fallingSpeedX: (Math.random() - 0.5) * 3 + Math.sin(petal.angle),
                fallingSpeedY: Math.random() * 2 + 1,
                rotation: petal.angle,
                rotationSpeed: (Math.random() - 0.5) * 0.1
            });
        }
    }
}

function init() {
    flowers = [];
    fallingPetals = [];
    fireflies = [];
    
    // Configuración para ser responsive
    const isMobile = width < 768;
    const numFlowers = isMobile ? 5 : 8; // Menos flores en móviles para mejor rendimiento
    const spacing = width / (numFlowers + 1);
    
    // Crear flores a lo largo de la pantalla
    for (let i = 1; i <= numFlowers; i++) {
        // Variación aleatoria en la posición X
        const offsetX = (Math.random() - 0.5) * spacing * 0.6;
        const x = spacing * i + offsetX;
        
        // Alturas variadas para darle profundidad
        const targetHeight = height * (isMobile ? 0.4 : 0.5) + Math.random() * height * 0.3;
        
        // Escala variada
        const scale = 0.7 + Math.random() * 0.5;
        
        flowers.push(new Flower(x, targetHeight, scale));
    }
    
    // Ordenar flores por escala para que las más pequeñas (más lejanas) se dibujen atrás
    flowers.sort((a, b) => a.scale - b.scale);

    // Crear luciérnagas de fondo
    const numFireflies = isMobile ? 30 : 60;
    for(let i = 0; i < numFireflies; i++) {
        fireflies.push({
            x: Math.random() * width,
            y: Math.random() * height,
            size: Math.random() * 2 + 0.5,
            speedX: (Math.random() - 0.5) * 0.8,
            speedY: (Math.random() - 0.5) * 0.8,
            opacity: Math.random(),
            pulseSpeed: 0.02 + Math.random() * 0.03,
            pulseTime: Math.random() * Math.PI * 2
        });
    }
}

function drawFireflies() {
    fireflies.forEach(f => {
        f.x += f.speedX;
        f.y += f.speedY;
        
        // Reposicionar al salir de los bordes
        if(f.x < 0) f.x = width;
        if(f.x > width) f.x = 0;
        if(f.y < 0) f.y = height;
        if(f.y > height) f.y = 0;
        
        // Efecto de parpadeo (pulsación) suave
        f.pulseTime += f.pulseSpeed;
        const currentOpacity = f.opacity * (0.5 + Math.sin(f.pulseTime) * 0.5);
        
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.size, 0, Math.PI*2);
        ctx.fillStyle = `rgba(255, 255, 200, ${currentOpacity})`;
        ctx.shadowColor = '#fff59d';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0; // Reiniciar sombra para no afectar al resto
    });
}

function drawFallingPetals() {
    for (let i = fallingPetals.length - 1; i >= 0; i--) {
        const p = fallingPetals[i];
        
        // Actualizar posición y rotación
        p.x += p.fallingSpeedX;
        p.y += p.fallingSpeedY;
        p.rotation += p.rotationSpeed;
        
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        
        ctx.beginPath();
        const pLength = 45 * p.scale;
        const pWidth = 15 * p.scale;
        
        // Dibujar el mismo estilo de pétalo
        ctx.ellipse(pLength / 2, 0, pLength / 2, pWidth, 0, 0, Math.PI * 2);
        
        const gradient = ctx.createLinearGradient(0, 0, pLength, 0);
        gradient.addColorStop(0, '#f57f17');
        gradient.addColorStop(0.3, '#ffb300');
        gradient.addColorStop(1, '#ffee58');
        
        ctx.fillStyle = gradient;
        ctx.shadowColor = 'rgba(255, 235, 59, 0.3)';
        ctx.shadowBlur = 5;
        ctx.fill();
        ctx.restore();
        
        // Eliminar pétalo cuando cae fuera de la pantalla
        if (p.y > height + 100) {
            fallingPetals.splice(i, 1);
        }
    }
}

function animate() {
    ctx.clearRect(0, 0, width, height);
    
    // Fondo de luciérnagas
    drawFireflies();
    
    // Animación de cada flor
    flowers.forEach(f => {
        f.update();
        f.draw();
    });
    
    // Pétalos cayendo
    drawFallingPetals();
    
    requestAnimationFrame(animate);
}

// Lógica de Interacción al hacer clic / tocar
function triggerInteraction() {
    if (!clicked) {
        clicked = true;
        // Mostrar mensaje suavemente la primera vez que se interactúa
        messageContainer.classList.add('show');
    }
    // Provocar la caída de algunos pétalos en todas las flores maduras
    flowers.forEach(f => {
        if(f.stemGrown) f.shatter();
    });
}

canvas.addEventListener('click', triggerInteraction);
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Prevenir comportamientos de arrastre en móviles
    triggerInteraction();
});

// Lógica de Música
const bgMusic = document.getElementById('bgMusic');
const musicToggle = document.getElementById('musicToggle');
let isMusicPlaying = false;

if (musicToggle && bgMusic) {
    musicToggle.addEventListener('click', (e) => {
        e.stopPropagation(); // Evitar que el clic pase al canvas
        if (isMusicPlaying) {
            bgMusic.pause();
            musicToggle.textContent = '🎵 Reproducir Canción';
        } else {
            bgMusic.play();
            musicToggle.textContent = '⏸️ Pausar Canción';
        }
        isMusicPlaying = !isMusicPlaying;
    });
}

// Iniciar aplicación
init();
animate();
