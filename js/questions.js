/**
 * SISTEMA DE PREGUNTAS EDUCATIVAS - CID DEFENDER
 * Banco de preguntas y gestión del sistema de quizzes
 */

// Definir categorías primero para que estén disponibles
const QUESTION_CATEGORIES = {
    CID: 'Tríada CID',
    HERRAMIENTAS: 'Herramientas de Seguridad',
    AMENAZAS: 'Amenazas Cibernéticas',
    POLITICAS: 'Políticas y Mejores Prácticas'
};

const DIFFICULTY_LEVELS = {
    EASY: 'easy',
    MEDIUM: 'medium',
    HARD: 'hard'
};

class QuestionManager {
    constructor() {
        this.categories = QUESTION_CATEGORIES;
        this.difficultyLevels = DIFFICULTY_LEVELS;
        this.questions = this.initializeQuestions();
        this.usedQuestions = new Set();
    }

    /**
     * BANCO DE PREGUNTAS SOBRE SEGURIDAD LÓGICA
     */
    initializeQuestions() {
        return [
            // === TRÍADA CID ===
            {
                id: 1,
                question: "¿Qué principio de la tríada CID asegura que la información solo sea accesible para usuarios autorizados?",
                options: [
                    "Confidencialidad",
                    "Integridad", 
                    "Disponibilidad",
                    "Autenticación"
                ],
                correct: 0,
                category: this.categories.CID,
                difficulty: this.difficultyLevels.EASY,
                explanation: "La Confidencialidad protege la información del acceso no autorizado."
            },
            {
                id: 2,
                question: "¿Cuál de estos es un ejemplo de violación de la Integridad?",
                options: [
                    "Un hacker lee emails privados",
                    "Un empleado modifica datos financieros sin autorización",
                    "Un servidor se cae por un ataque DDoS",
                    "Un virus se propaga por la red"
                ],
                correct: 1,
                category: this.categories.CID,
                difficulty: this.difficultyLevels.MEDIUM,
                explanation: "La Integridad se viola cuando los datos son alterados sin autorización."
            },
            {
                id: 3,
                question: "¿Qué principio garantiza que los sistemas estén operativos cuando se necesitan?",
                options: [
                    "Confidencialidad",
                    "Integridad",
                    "Disponibilidad", 
                    "Auditoría"
                ],
                correct: 2,
                category: this.categories.CID,
                difficulty: this.difficultyLevels.EASY,
                explanation: "La Disponibilidad asegura el acceso a los sistemas y datos cuando se requieren."
            },
            {
                id: 4,
                question: "¿Qué medida protege principalmente la Confidencialidad?",
                options: [
                    "Copias de seguridad",
                    "Sistemas de redundancia",
                    "Cifrado de datos",
                    "Control de versiones"
                ],
                correct: 2,
                category: this.categories.CID,
                difficulty: this.difficultyLevels.MEDIUM,
                explanation: "El cifrado protege la confidencialidad haciendo la información ilegible sin la clave adecuada."
            },

            // === HERRAMIENTAS DE SEGURIDAD ===
            {
                id: 5,
                question: "¿Qué herramienta filtra el tráfico de red basándose en reglas predefinidas?",
                options: [
                    "Antivirus",
                    "Firewall",
                    "IDS",
                    "VPN"
                ],
                correct: 1,
                category: this.categories.HERRAMIENTAS,
                difficulty: this.difficultyLevels.EASY,
                explanation: "El firewall actúa como barrera entre redes, filtrando tráfico según reglas de seguridad."
            },
            {
                id: 6,
                question: "¿Qué protocolo proporciona comunicaciones cifradas para la web (HTTPS)?",
                options: [
                    "SSH",
                    "SSL/TLS",
                    "IPSec", 
                    "Kerberos"
                ],
                correct: 1,
                category: this.categories.HERRAMIENTAS,
                difficulty: this.difficultyLevels.MEDIUM,
                explanation: "SSL/TLS son protocolos de cifrado que aseguran las comunicaciones web."
            },
            {
                id: 7,
                question: "¿Qué sistema centraliza la gestión de identidades en entornos Windows?",
                options: [
                    "Firewall de Windows",
                    "Active Directory",
                    "Group Policy",
                    "Windows Defender"
                ],
                correct: 1,
                category: this.categories.HERRAMIENTAS,
                difficulty: this.difficultyLevels.MEDIUM,
                explanation: "Active Directory gestiona usuarios, equipos y permisos de forma centralizada."
            },
            {
                id: 8,
                question: "¿Qué herramienta detecta actividades maliciosas en la red?",
                options: [
                    "Firewall",
                    "Antivirus",
                    "IDS/IPS",
                    "VPN"
                ],
                correct: 2,
                category: this.categories.HERRAMIENTAS,
                difficulty: this.difficultyLevels.MEDIUM,
                explanation: "Los Sistemas de Detección/Prevención de Intrusos monitorizan la red en busca de amenazas."
            },

            // === AMENAZAS CIBERNÉTICAS ===
            {
                id: 9,
                question: "¿Qué tipo de malware bloquea el acceso a sistemas y exige un rescate?",
                options: [
                    "Virus",
                    "Troyano",
                    "Ransomware",
                    "Spyware"
                ],
                correct: 2,
                category: this.categories.AMENAZAS,
                difficulty: this.difficultyLevels.EASY,
                explanation: "El ransomware cifra archivos y exige pago para restaurar el acceso."
            },
            {
                id: 10,
                question: "¿Qué ataque satura un servicio para hacerlo inaccesible?",
                options: [
                    "Phishing",
                    "DDoS",
                    "Man-in-the-middle",
                    "SQL Injection"
                ],
                correct: 1,
                category: this.categories.AMENAZAS,
                difficulty: this.difficultyLevels.MEDIUM,
                explanation: "Los ataques DDoS (Denegación de Servicio Distribuido) sobrecargan los recursos del sistema."
            },
            {
                id: 11,
                question: "¿Qué técnica engaña a usuarios para revelar información confidencial?",
                options: [
                    "Ransomware",
                    "Phishing",
                    "Virus",
                    "Troyano"
                ],
                correct: 1,
                category: this.categories.AMENAZAS,
                difficulty: this.difficultyLevels.EASY,
                explanation: "El phishing usa correos o mensajes falsos para obtener credenciales."
            },
            {
                id: 12,
                question: "¿Qué amenaza se disfraza de software legítimo pero contiene código malicioso?",
                options: [
                    "Virus",
                    "Troyano",
                    "Ransomware", 
                    "Spyware"
                ],
                correct: 1,
                category: this.categories.AMENAZAS,
                difficulty: this.difficultyLevels.MEDIUM,
                explanation: "Los troyanos se presentan como software útil pero ejecutan acciones maliciosas."
            },

            // === POLÍTICAS Y MEJORES PRÁCTICAS ===
            {
                id: 13,
                question: "¿Qué principio establece que los usuarios deben tener solo los permisos necesarios?",
                options: [
                    "Defensa en profundidad",
                    "Mínimo privilegio",
                    "Seguridad por oscuridad",
                    "Control de acceso obligatorio"
                ],
                correct: 1,
                category: this.categories.POLITICAS,
                difficulty: this.difficultyLevels.MEDIUM,
                explanation: "El principio de mínimo privilegio reduce el riesgo limitando los permisos de usuario."
            },
            {
                id: 14,
                question: "¿Qué estrategia usa múltiples capas de seguridad?",
                options: [
                    "Mínimo privilegio",
                    "Defensa en profundidad",
                    "Seguridad por diseño",
                    "Control de acceso basado en roles"
                ],
                correct: 1,
                category: this.categories.POLITICAS,
                difficulty: this.difficultyLevels.MEDIUM,
                explanation: "La defensa en profundidad implementa varias capas de protección."
            },
            {
                id: 15,
                question: "¿Qué política recomienda cambiar contraseñas periódicamente?",
                options: [
                    "Política de respaldos",
                    "Política de contraseñas",
                    "Política de acceso remoto",
                    "Política de uso aceptable"
                ],
                correct: 1,
                category: this.categories.POLITICAS,
                difficulty: this.difficultyLevels.EASY,
                explanation: "Las políticas de contraseñas establecen requisitos de complejidad y caducidad."
            },
            {
                id: 16,
                question: "¿Qué estándar internacional especifica requisitos para sistemas de gestión de seguridad?",
                options: [
                    "ISO 27001",
                    "PCI DSS",
                    "NIST CSF",
                    "GDPR"
                ],
                correct: 0,
                category: this.categories.POLITICAS,
                difficulty: this.difficultyLevels.HARD,
                explanation: "ISO 27001 es el estándar internacional para sistemas de gestión de seguridad de la información."
            },
            {
                id: 17,
                question: "¿Qué protocolo de autenticación usa 'tickets' en entornos de red?",
                options: [
                    "SSL/TLS",
                    "SSH",
                    "Kerberos",
                    "IPSec"
                ],
                correct: 2,
                category: this.categories.HERRAMIENTAS,
                difficulty: this.difficultyLevels.HARD,
                explanation: "Kerberos utiliza un sistema de tickets para autenticación en redes no seguras."
            },
            {
                id: 18,
                question: "¿Qué técnica divide una red en segmentos para contener brechas?",
                options: [
                    "Cifrado",
                    "Segmentación de red",
                    "Balanceo de carga",
                    "Redundancia"
                ],
                correct: 1,
                category: this.categories.HERRAMIENTAS,
                difficulty: this.difficultyLevels.MEDIUM,
                explanation: "La segmentación de red limita el movimiento lateral de atacantes."
            },
            {
                id: 19,
                question: "¿Qué herramienta automatiza la instalación de actualizaciones de seguridad?",
                options: [
                    "Firewall",
                    "Gestor de parches",
                    "Antivirus",
                    "Sistema de backup"
                ],
                correct: 1,
                category: this.categories.HERRAMIENTAS,
                difficulty: this.difficultyLevels.MEDIUM,
                explanation: "Los gestores de parches automatizan la aplicación de actualizaciones críticas."
            },
            {
                id: 20,
                question: "¿Qué principio asegura que pueda recuperarse después de un incidente?",
                options: [
                    "Prevención",
                    "Detección",
                    "Recuperación",
                    "Respuesta"
                ],
                correct: 2,
                category: this.categories.POLITICAS,
                difficulty: this.difficultyLevels.MEDIUM,
                explanation: "La recuperación es clave en la continuidad del negocio después de incidentes."
            }
        ];
    }

    /**
     * GESTIÓN DE PREGUNTAS
     */
    getRandomQuestion() {
        // Filtrar preguntas no utilizadas
        const availableQuestions = this.questions.filter(q => !this.usedQuestions.has(q.id));
        
        if (availableQuestions.length === 0) {
            // Si no hay preguntas disponibles, reiniciar el conjunto
            utils.log("Todas las preguntas usadas, reiniciando conjunto...");
            this.usedQuestions.clear();
            return this.getRandomQuestion();
        }
        
        // Seleccionar pregunta aleatoria
        const randomQuestion = utils.randomFromArray(availableQuestions);
        
        // Marcar como usada
        this.usedQuestions.add(randomQuestion.id);
        
        utils.log(`Pregunta seleccionada: ${randomQuestion.question.substring(0, 50)}...`);
        return randomQuestion;
    }

    getQuestionsByCategory(category) {
        return this.questions.filter(q => q.category === category);
    }

    getQuestionsByDifficulty(difficulty) {
        return this.questions.filter(q => q.difficulty === difficulty);
    }

    getQuestionById(id) {
        return this.questions.find(q => q.id === id);
    }

    /**
     * VALIDACIÓN DE RESPUESTAS
     */
    validateAnswer(questionId, selectedOption) {
        const question = this.getQuestionById(questionId);
        if (!question) {
            return { correct: false, explanation: "Pregunta no encontrada" };
        }
        
        const isCorrect = selectedOption === question.correct;
        
        return {
            correct: isCorrect,
            explanation: question.explanation,
            correctAnswer: question.options[question.correct]
        };
    }

    /**
     * ESTADÍSTICAS Y PROGRESO
     */
    getCategoryStats() {
        const stats = {};
        
        Object.values(this.categories).forEach(category => {
            const categoryQuestions = this.getQuestionsByCategory(category);
            const usedInCategory = categoryQuestions.filter(q => this.usedQuestions.has(q.id));
            
            stats[category] = {
                total: categoryQuestions.length,
                used: usedInCategory.length,
                percentage: (usedInCategory.length / categoryQuestions.length) * 100
            };
        });
        
        return stats;
    }

    getDifficultyStats() {
        const stats = {};
        
        Object.values(this.difficultyLevels).forEach(difficulty => {
            const difficultyQuestions = this.getQuestionsByDifficulty(difficulty);
            const usedInDifficulty = difficultyQuestions.filter(q => this.usedQuestions.has(q.id));
            
            stats[difficulty] = {
                total: difficultyQuestions.length,
                used: usedInDifficulty.length,
                percentage: (usedInDifficulty.length / difficultyQuestions.length) * 100
            };
        });
        
        return stats;
    }

    resetProgress() {
        this.usedQuestions.clear();
        utils.log("Progreso de preguntas reiniciado");
    }

    /**
     * GENERACIÓN DE REPORTES
     */
    generateProgressReport() {
        const categoryStats = this.getCategoryStats();
        const difficultyStats = this.getDifficultyStats();
        
        let report = "📊 REPORTE DE PROGRESO - SEGURIDAD LÓGICA\n\n";
        
        report += "📚 POR CATEGORÍA:\n";
        Object.entries(categoryStats).forEach(([category, stat]) => {
            report += `• ${category}: ${stat.used}/${stat.total} (${stat.percentage.toFixed(1)}%)\n`;
        });
        
        report += "\n🎯 POR DIFICULTAD:\n";
        Object.entries(difficultyStats).forEach(([difficulty, stat]) => {
            const difficultyName = this.getDifficultyName(difficulty);
            report += `• ${difficultyName}: ${stat.used}/${stat.total} (${stat.percentage.toFixed(1)}%)\n`;
        });
        
        return report;
    }

    getDifficultyName(difficulty) {
        const names = {
            [this.difficultyLevels.EASY]: 'Fácil',
            [this.difficultyLevels.MEDIUM]: 'Medio',
            [this.difficultyLevels.HARD]: 'Difícil'
        };
        return names[difficulty] || difficulty;
    }

    /**
     * EXPORTACIÓN/IMPORTACIÓN DE DATOS
     */
    exportProgress() {
        return {
            usedQuestions: Array.from(this.usedQuestions),
            timestamp: Date.now()
        };
    }

    importProgress(data) {
        if (data && data.usedQuestions) {
            this.usedQuestions = new Set(data.usedQuestions);
            utils.log("Progreso de preguntas importado");
            return true;
        }
        return false;
    }

    /**
     * UTILIDADES PARA EL JUEGO
     */
    getQuestionCount() {
        return this.questions.length;
    }

    getUsedQuestionCount() {
        return this.usedQuestions.size;
    }

    getRemainingQuestionCount() {
        return this.questions.length - this.usedQuestions.size;
    }

    isAllQuestionsUsed() {
        return this.usedQuestions.size >= this.questions.length;
    }
}

// Instancia global del manager de preguntas
const questionManager = new QuestionManager();