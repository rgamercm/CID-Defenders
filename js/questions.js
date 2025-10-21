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
     * BANCO DE PREGUNTAS ESPECÍFICAS POR PILAR CID
     */
    initializeQuestions() {
        return [
            // === CONFIDENCIALIDAD ===
            {
                id: 1,
                question: "¿Qué garantiza que la información se mantenga secreta o privada, restringiendo el acceso?",
                options: [
                    "Integridad",
                    "Confidencialidad", 
                    "Disponibilidad",
                    "Balanceo"
                ],
                correct: 1,
                category: "Confidencialidad",
                difficulty: this.difficultyLevels.EASY,
                explanation: "La Confidencialidad protege la información del acceso no autorizado."
            },
            {
                id: 2,
                question: "¿Qué técnica hace ilegible la información para personas no autorizadas en el tránsito o en reposo?",
                options: [
                    "Hashing",
                    "Failover",
                    "Cifrado",
                    "Logs"
                ],
                correct: 2,
                category: "Confidencialidad",
                difficulty: this.difficultyLevels.MEDIUM,
                explanation: "El cifrado transforma la información en formato ilegible sin la clave adecuada."
            },
            {
                id: 3,
                question: "¿Qué sistema verifica la identidad con más de un factor para un acceso más seguro?",
                options: [
                    "RAID",
                    "DRP",
                    "MFA",
                    "DNS"
                ],
                correct: 2,
                category: "Confidencialidad",
                difficulty: this.difficultyLevels.MEDIUM,
                explanation: "MFA (Multi-Factor Authentication) usa múltiples métodos de verificación."
            },
            {
                id: 4,
                question: "¿Qué principio limita los permisos de un usuario a lo estrictamente necesario para su función?",
                options: [
                    "Alta disponibilidad",
                    "Mínimo privilegio",
                    "Acceso universal",
                    "Defensa en profundidad"
                ],
                correct: 1,
                category: "Confidencialidad",
                difficulty: this.difficultyLevels.MEDIUM,
                explanation: "El principio de mínimo privilegio reduce riesgos limitando permisos."
            },
            {
                id: 5,
                question: "¿Qué herramienta cifra un canal de comunicación de punto A a punto B, como una red privada sobre una pública?",
                options: [
                    "IDS",
                    "VPN",
                    "IPS",
                    "Git"
                ],
                correct: 1,
                category: "Confidencialidad",
                difficulty: this.difficultyLevels.MEDIUM,
                explanation: "Las VPN (Redes Privadas Virtuales) crean túneles cifrados seguros."
            },
            {
                id: 6,
                question: "¿Qué ataque compromete la confidencialidad al posicionarse en el flujo de información para interceptar datos?",
                options: [
                    "DDoS",
                    "Ransomware",
                    "Man-in-the-Middle",
                    "Phishing"
                ],
                correct: 2,
                category: "Confidencialidad",
                difficulty: this.difficultyLevels.HARD,
                explanation: "Los ataques Man-in-the-Middle interceptan comunicaciones sin detección."
            },
            {
                id: 7,
                question: "¿Qué método se utiliza para ocultar un archivo sensible dentro de los píxeles de una fotografía?",
                options: [
                    "Cifrado",
                    "Checksum",
                    "Esteganografía",
                    "Backup"
                ],
                correct: 2,
                category: "Confidencialidad",
                difficulty: this.difficultyLevels.HARD,
                explanation: "La esteganografía oculta información dentro de otros archivos."
            },
            {
                id: 8,
                question: "El uso de permisos NTFS y la gestión de roles en un Active Directory se usan para controlar el:",
                options: [
                    "Desastre",
                    "Acceso",
                    "Rendimiento",
                    "Hash"
                ],
                correct: 1,
                category: "Confidencialidad",
                difficulty: this.difficultyLevels.MEDIUM,
                explanation: "Estos sistemas controlan quién puede acceder a qué recursos."
            },
            {
                id: 9,
                question: "¿Cómo se llama al proceso de categorizar la data según el daño potencial si es expuesta a personas no deseadas?",
                options: [
                    "Hardening",
                    "Auditoría",
                    "Clasificación de datos",
                    "Reparación"
                ],
                correct: 2,
                category: "Confidencialidad",
                difficulty: this.difficultyLevels.MEDIUM,
                explanation: "La clasificación ayuda a priorizar la protección de datos sensibles."
            },
            {
                id: 10,
                question: "¿Cuál de estos errores humanos compromete la Confidencialidad al permitir que alguien vea el inicio de sesión?",
                options: [
                    "Parcheo tardío",
                    "Credenciales compartidas",
                    "Hashing débil",
                    "Redundancia insuficiente"
                ],
                correct: 1,
                category: "Confidencialidad",
                difficulty: this.difficultyLevels.EASY,
                explanation: "Compartir credenciales permite acceso no autorizado a información confidencial."
            },

            // === INTEGRIDAD ===
            {
                id: 11,
                question: "¿Qué pilar garantiza que los datos sean auténticos, precisos y confiables a lo largo de su ciclo de vida?",
                options: [
                    "Confidencialidad",
                    "Integridad",
                    "Disponibilidad",
                    "Privacidad"
                ],
                correct: 1,
                category: "Integridad",
                difficulty: this.difficultyLevels.EASY,
                explanation: "La Integridad asegura que los datos no sean alterados indebidamente."
            },
            {
                id: 12,
                question: "¿Qué técnica se utiliza para verificar la Integridad, ya que una pequeña modificación en el archivo cambia completamente la cadena resultante?",
                options: [
                    "Cifrado",
                    "Hash",
                    "VPN",
                    "SNMP"
                ],
                correct: 1,
                category: "Integridad",
                difficulty: this.difficultyLevels.MEDIUM,
                explanation: "Las funciones hash generan valores únicos que cambian si los datos se modifican."
            },
            {
                id: 13,
                question: "¿Qué concepto se asegura con Firmas Digitales, previniendo que el remitente o el receptor puedan negar el envío o recepción de la información?",
                options: [
                    "Confidencialidad",
                    "Disponibilidad",
                    "Redundancia",
                    "No repudio"
                ],
                correct: 3,
                category: "Integridad",
                difficulty: this.difficultyLevels.HARD,
                explanation: "El no repudio garantiza que no se pueda negar la autoría de una acción."
            },
            {
                id: 14,
                question: "¿Qué práctica de gestión de datos, como Git, permite evitar la eliminación accidental de información por parte de usuarios autorizados?",
                options: [
                    "Hashing",
                    "Control de versiones",
                    "Cifrado",
                    "Biometría"
                ],
                correct: 1,
                category: "Integridad",
                difficulty: this.difficultyLevels.MEDIUM,
                explanation: "El control de versiones mantiene historial de cambios y permite recuperaciones."
            },
            {
                id: 15,
                question: "¿Qué tipo de registros se mantienen para monitorear y detectar cambios no autorizados en los datos y reconstruir eventos?",
                options: [
                    "Firewalls",
                    "VPN",
                    "Logs de auditoría",
                    "Tokens"
                ],
                correct: 2,
                category: "Integridad",
                difficulty: this.difficultyLevels.MEDIUM,
                explanation: "Los logs registran todas las actividades para detectar modificaciones no autorizadas."
            },
            {
                id: 16,
                question: "¿Qué debe estar disponible para restaurar la Integridad de los datos a su estado correcto si se ven afectados por eventos como un bloqueo del servidor?",
                options: [
                    "Cifrado",
                    "Copias de seguridad",
                    "Balanceo",
                    "Parches"
                ],
                correct: 1,
                category: "Integridad",
                difficulty: this.difficultyLevels.EASY,
                explanation: "Las copias de seguridad permiten restaurar datos a un estado íntegro conocido."
            },
            {
                id: 17,
                question: "¿Qué se utiliza para verificar la autenticidad de un sitio web para que los visitantes sepan que están en el lugar correcto?",
                options: [
                    "MFA",
                    "Certificados SSL/TLS",
                    "RAID",
                    "DRP"
                ],
                correct: 1,
                category: "Integridad",
                difficulty: this.difficultyLevels.MEDIUM,
                explanation: "Los certificados digitales verifican la identidad de sitios web."
            },
            {
                id: 18,
                question: "Un ataque que intenta cambiar las configuraciones de archivos para permitir el acceso no autorizado pone en riesgo la:",
                options: [
                    "Confidencialidad",
                    "Integridad",
                    "Disponibilidad",
                    "Recuperación"
                ],
                correct: 1,
                category: "Integridad",
                difficulty: this.difficultyLevels.MEDIUM,
                explanation: "Modificar configuraciones sin autorización viola la integridad del sistema."
            },
            {
                id: 19,
                question: "¿Cuál es el nombre de la institución que verifica la autenticidad de los sitios web a través de certificados?",
                options: [
                    "SANS",
                    "Autoridades de Certificación",
                    "NIST",
                    "ISO"
                ],
                correct: 1,
                category: "Integridad",
                difficulty: this.difficultyLevels.HARD,
                explanation: "Las Autoridades de Certificación emiten y verifican certificados digitales."
            },
            {
                id: 20,
                question: "El cofundador de Cross Strike enfatizó que si la información es alterada, las consecuencias pueden ser:",
                options: [
                    "Simples",
                    "Catastróficas",
                    "Lentas",
                    "Comunes"
                ],
                correct: 1,
                category: "Integridad",
                difficulty: this.difficultyLevels.EASY,
                explanation: "La alteración de información crítica puede tener consecuencias graves."
            },

            // === DISPONIBILIDAD ===
            {
                id: 21,
                question: "¿Qué pilar garantiza que los sistemas y los datos sean accesibles para los usuarios cuando se necesiten?",
                options: [
                    "Integridad",
                    "Confidencialidad",
                    "Disponibilidad",
                    "Precisión"
                ],
                correct: 2,
                category: "Disponibilidad",
                difficulty: this.difficultyLevels.EASY,
                explanation: "La Disponibilidad asegura el acceso continuo a sistemas y datos."
            },
            {
                id: 22,
                question: "¿Qué acto malicioso compromete directamente la Disponibilidad al saturar un servicio con tráfico?",
                options: [
                    "Phishing",
                    "Ataque DDoS",
                    "Spoofing",
                    "Cifrado"
                ],
                correct: 1,
                category: "Disponibilidad",
                difficulty: this.difficultyLevels.MEDIUM,
                explanation: "Los ataques DDoS sobrecargan servicios haciendo que no estén disponibles."
            },
            {
                id: 23,
                question: "La implementación de servidores y aplicaciones ________ ayuda a la Disponibilidad cuando el sistema primario falla.",
                options: [
                    "Estáticas",
                    "Redundantes",
                    "Cifradas",
                    "Auténticas"
                ],
                correct: 1,
                category: "Disponibilidad",
                difficulty: this.difficultyLevels.MEDIUM,
                explanation: "La redundancia proporciona componentes de respaldo para mantener servicios."
            },
            {
                id: 24,
                question: "¿Qué técnica se usa para distribuir el tráfico entre múltiples servidores para evitar la sobrecarga?",
                options: [
                    "VPN",
                    "DNS",
                    "Balanceo de carga",
                    "SSL"
                ],
                correct: 2,
                category: "Disponibilidad",
                difficulty: this.difficultyLevels.MEDIUM,
                explanation: "El balanceo de carga distribuye el trabajo entre múltiples servidores."
            },
            {
                id: 25,
                question: "El plan integral que permite recuperar el acceso a sistemas críticos tras un desastre grave se conoce como:",
                options: [
                    "PMP",
                    "Plan de Recuperación ante Desastres",
                    "MFA",
                    "IDS"
                ],
                correct: 1,
                category: "Disponibilidad",
                difficulty: this.difficultyLevels.MEDIUM,
                explanation: "El DRP asegura la continuidad del negocio después de incidentes graves."
            },
            {
                id: 26,
                question: "El rigor en el mantenimiento de todo el ________ es crucial para asegurar que los servicios sigan disponibles.",
                options: [
                    "Software",
                    "Hardware",
                    "Cifrado",
                    "Balanceo"
                ],
                correct: 1,
                category: "Disponibilidad",
                difficulty: this.difficultyLevels.EASY,
                explanation: "El hardware bien mantenido es esencial para la disponibilidad continua."
            },
            {
                id: 27,
                question: "¿Qué tipo de sistemas se utilizan en servidores para mitigar las graves consecuencias cuando fallan los discos duros?",
                options: [
                    "VPN",
                    "RAID",
                    "PGP",
                    "EDR"
                ],
                correct: 1,
                category: "Disponibilidad",
                difficulty: this.difficultyLevels.MEDIUM,
                explanation: "RAID proporciona redundancia de discos para prevenir pérdida de datos."
            },
            {
                id: 28,
                question: "Si el sistema primario falla, se puede aprovisionar servicios casi inmediatamente mediante un sitio:",
                options: [
                    "Cifrado",
                    "Secundario de respaldo",
                    "Centralizado",
                    "Auditable"
                ],
                correct: 1,
                category: "Disponibilidad",
                difficulty: this.difficultyLevels.MEDIUM,
                explanation: "Los sitios de respaldo permiten continuidad operacional inmediata."
            },
            {
                id: 29,
                question: "Las organizaciones deben mantenerse al tanto de las ________ del software para que las aplicaciones no funcionen mal y no se pierda la Disponibilidad.",
                options: [
                    "Hashing",
                    "Actualizaciones",
                    "Logs",
                    "Roles"
                ],
                correct: 1,
                category: "Disponibilidad",
                difficulty: this.difficultyLevels.EASY,
                explanation: "Las actualizaciones corrigen errores que podrían afectar la disponibilidad."
            },
            {
                id: 30,
                question: "Si se implementa una autenticación muy estricta (alta Confidencialidad), el sistema puede volverse lento y ser menos ________ para los usuarios legítimos.",
                options: [
                    "Íntegro",
                    "Disponible",
                    "Cifrado",
                    "Privado"
                ],
                correct: 1,
                category: "Disponibilidad",
                difficulty: this.difficultyLevels.HARD,
                explanation: "Hay un balance necesario entre seguridad y usabilidad/rendimiento."
            },

            // === PREGUNTAS GENERALES (como respaldo) ===
            {
                id: 31,
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
                id: 32,
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
            }
        ];
    }

    /**
     * GESTIÓN DE PREGUNTAS ESPECÍFICAS POR DEFENSOR
     */
    getQuestionForDefensor(defensorName) {
        // Filtrar preguntas específicas para el defensor atacado
        const defensorQuestions = this.questions.filter(q => 
            q.category === defensorName && !this.usedQuestions.has(q.id)
        );

        if (defensorQuestions.length > 0) {
            const question = utils.randomFromArray(defensorQuestions);
            this.usedQuestions.add(question.id);
            console.log(`🎯 Pregunta específica para ${defensorName}: ${question.question.substring(0, 50)}...`);
            return question;
        }

        // Si no hay preguntas específicas disponibles, usar cualquier pregunta no usada
        console.log(`ℹ️  No hay preguntas específicas para ${defensorName}, usando pregunta general`);
        return this.getRandomQuestion();
    }

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
        
        // Incluir categorías de defensores
        const allCategories = [...Object.values(this.categories), "Confidencialidad", "Integridad", "Disponibilidad"];
        
        allCategories.forEach(category => {
            const categoryQuestions = this.getQuestionsByCategory(category);
            const usedInCategory = categoryQuestions.filter(q => this.usedQuestions.has(q.id));
            
            if (categoryQuestions.length > 0) {
                stats[category] = {
                    total: categoryQuestions.length,
                    used: usedInCategory.length,
                    percentage: (usedInCategory.length / categoryQuestions.length) * 100
                };
            }
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