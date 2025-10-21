/**
 * UTILIDADES PARA CID DEFENDER
 * Funciones auxiliares para el juego
 */

class GameUtils {
    constructor() {
        this.debug = true;
    }

    /**
     * DETECCIÓN DE COLISIONES
     */

    // Colisión círculo-círculo
    circleCollision(x1, y1, r1, x2, y2, r2) {
        const dx = x1 - x2;
        const dy = y1 - y2;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (r1 + r2);
    }

    // Colisión rectángulo-rectángulo
    rectCollision(rect1, rect2) {
        return (
            rect1.x < rect2.x + rect2.width &&
            rect1.x + rect1.width > rect2.x &&
            rect1.y < rect2.y + rect2.height &&
            rect1.y + rect1.height > rect2.y
        );
    }

    // Colisión punto-rectángulo
    pointInRect(x, y, rect) {
        return (
            x >= rect.x &&
            x <= rect.x + rect.width &&
            y >= rect.y &&
            y <= rect.y + rect.height
        );
    }

    /**
     * FUNCIONES MATEMÁTICAS
     */

    // Distancia entre dos puntos
    distance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    }

    // Ángulo entre dos puntos (en radianes)
    angleBetween(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    }

    // Número aleatorio en rango [min, max]
    random(min, max) {
        return Math.random() * (max - min) + min;
    }

    // Número entero aleatorio en rango [min, max]
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // Mapear valor de un rango a otro
    map(value, start1, stop1, start2, stop2) {
        return start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1));
    }

    // Limitar valor entre min y max
    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    /**
     * MANEJO DE ARRAYS Y OBJETOS
     */

    // Obtener elemento aleatorio de array
    randomFromArray(array) {
        return array[this.randomInt(0, array.length - 1)];
    }

    // Barajar array (Fisher-Yates shuffle)
    shuffleArray(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }

    // Filtrar array por propiedad
    filterByProperty(array, property, value) {
        return array.filter(item => item[property] === value);
    }

    // Encontrar elemento por ID
    findById(array, id) {
        return array.find(item => item.id === id);
    }

    /**
     * MANEJO DE DOM Y EVENTOS
     */

    // Crear elemento DOM con atributos
    createElement(tag, attributes = {}, children = []) {
        const element = document.createElement(tag);
        
        // Atributos
        Object.keys(attributes).forEach(key => {
            if (key === 'className') {
                element.className = attributes[key];
            } else if (key === 'textContent') {
                element.textContent = attributes[key];
            } else if (key === 'innerHTML') {
                element.innerHTML = attributes[key];
            } else {
                element.setAttribute(key, attributes[key]);
            }
        });

        // Hijos
        children.forEach(child => {
            if (typeof child === 'string') {
                element.appendChild(document.createTextNode(child));
            } else {
                element.appendChild(child);
            }
        });

        return element;
    }

    // Mostrar/ocultar elemento
    toggleElement(element, show) {
        if (show) {
            element.style.display = 'block';
        } else {
            element.style.display = 'none';
        }
    }

    // Agregar evento con opciones
    addEvent(element, event, handler, options = {}) {
        element.addEventListener(event, handler, options);
        return () => element.removeEventListener(event, handler, options);
    }

    /**
     * MANEJO DE TIEMPO Y ANIMACIONES
     */

    // Formatear tiempo (segundos a MM:SS)
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    // Interpolación lineal
    lerp(start, end, factor) {
        return start + (end - start) * factor;
    }

    // Easing function (suave entrada y salida)
    easeInOut(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    /**
     * MANEJO DE ESTADO Y STORAGE
     */

    // Guardar en localStorage
    saveToStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            this.debug && console.error('Error guardando en storage:', error);
            return false;
        }
    }

    // Cargar desde localStorage
    loadFromStorage(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            this.debug && console.error('Error cargando desde storage:', error);
            return defaultValue;
        }
    }

    // Limpiar storage
    clearStorage(key = null) {
        try {
            if (key) {
                localStorage.removeItem(key);
            } else {
                localStorage.clear();
            }
            return true;
        } catch (error) {
            this.debug && console.error('Error limpiando storage:', error);
            return false;
        }
    }

    /**
     * DEBUG Y LOGGING
     */

    // Log condicional (solo en modo debug)
    log(...args) {
        if (this.debug) {
            console.log('[CID Defender]', ...args);
        }
    }

    // Error logging
    error(...args) {
        console.error('[CID Defender ERROR]', ...args);
    }

    // Performance measurement
    measurePerf(name, fn) {
        const start = performance.now();
        const result = fn();
        const end = performance.now();
        this.log(`${name} tomó ${(end - start).toFixed(2)}ms`);
        return result;
    }

    /**
     * VALIDACIONES
     */

    // Validar email básico
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Validar que es número
    isNumber(value) {
        return !isNaN(parseFloat(value)) && isFinite(value);
    }

    // Validar que está en rango
    isInRange(value, min, max) {
        return value >= min && value <= max;
    }
}

// Instancia global de utilidades
const utils = new GameUtils();

// Tests inmediatos si estamos en desarrollo
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    utils.runTests();
}