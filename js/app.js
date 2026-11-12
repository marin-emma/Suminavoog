let quizData = null;       
let scores = {};          
let selectedAnswers = {}; 

const randomColors = [
  '#FFD1DC', 
  '#B5EAD7',
  '#C7CEEA', 
  '#FFDAC1', 
  '#E2F0CB', 
  '#F3D1F4'  
];

const isIndexPage = document.getElementById('quiz-list-container') !== null;
const isQuizPage = document.getElementById('quiz-container') !== null;


if (isIndexPage) {
  fetch('data/quizzes.json')
    .then(res => res.json()) 
    .then(quizzes => {
      renderQuizCards(quizzes); 
    })
    .catch(err => {
      console.error('Viga testide nimekirja laadimisel:', err);
      document.getElementById('quiz-list-container').innerHTML = '<p>Proovi varsti uuesti, kui sa oled reflekteerinud oma valikuid.</p>';
    });
}

function renderQuizCards(quizzes) {
  const container = document.getElementById('quiz-list-container');
  let html = ''; 

  quizzes.forEach(quiz => {
    html += `
      <a href="quiz.html?test=${quiz.id}" class="quiz-preview-card">
        <img src="${quiz.image}" alt="${quiz.title}">
        <div class="card-text">
          <h3>${quiz.title}</h3>
        </div>
      </a>
    `;
  });

  container.innerHTML = html;
}

if (isQuizPage) {
  const urlParams = new URLSearchParams(window.location.search);
  const testName = urlParams.get('test') || 'cats';
  const jsonPath = `data/quiz-${testName}.json`;

  fetch(jsonPath)
    .then(res => res.json())
    .then(data => {
      quizData = data; 

      document.getElementById('banner-title').innerText = quizData.title;
      document.getElementById('banner-desc').innerText = quizData.description;

      renderQuiz();
    })
    .catch(err => {
      console.error('Viga testi laadimisel:', err);
      document.getElementById('quiz-container').innerHTML = '<p>Küsimustik ei taha sind praegu.</p>';
    });
}

function renderQuiz() {
  const container = document.getElementById('quiz-container');
  let html = '';

  const shuffledColors = [...randomColors].sort(() => Math.random() - 0.5);

  quizData.questions.forEach((q, qIndex) => {
    const pairColor = shuffledColors[qIndex % shuffledColors.length];

    html += `
      <div class="question-block" id="q-${qIndex}">
        <div class="question-box" style="background-color: ${pairColor};">
          <h3 class="question-title">${qIndex + 1}. ${q.text}</h3>
        </div>

        <div class="options-grid">
          ${q.options.map((opt, optIndex) => {
            const btnStyle = opt.image 
              ? `style="background-image: url('${opt.image}');"` 
              : `style="background-color: ${pairColor};"`;
            const btnClass = opt.image ? 'option-btn has-option-img' : 'option-btn';

            return `
              <button type="button" class="${btnClass}" ${btnStyle} onclick="selectOption(${qIndex},${optIndex})">
                <span>${opt.text}</span>
              </button>
            `;
          }).join('')} 
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

function selectOption(qIndex, optIndex) {
  selectedAnswers[qIndex] = optIndex;

  const questionBlock = document.getElementById(`q-${qIndex}`);
  const buttons = questionBlock.querySelectorAll('.option-btn');

  buttons.forEach(btn => btn.classList.remove('selected'));
  buttons[optIndex].classList.add('selected');

  calculateScores();

  const totalQuestions = quizData.questions.length;
  const answeredQuestions = Object.keys(selectedAnswers).length;

  if (answeredQuestions === totalQuestions) {
    showResult();
  }
}

function calculateScores() {
  scores = {}; 

  Object.keys(quizData.results).forEach(key => {
    scores[key] = 0;
  });

  Object.entries(selectedAnswers).forEach(([qIndex, optIndex]) => {
    const option = quizData.questions[qIndex].options[optIndex];

    if (option.scores) {
      Object.entries(option.scores).forEach(([resultKey, points]) => {
        if (scores[resultKey] !== undefined) {
          scores[resultKey] += points; 
        }
      });
    }
  });
}

function showResult() {
  const maxScore = Math.max(...Object.values(scores));
  const topKeys = Object.keys(scores).filter(key => scores[key] === maxScore);

  const randomIndex = Math.floor(Math.random() * topKeys.length);
  const winningKey = topKeys[randomIndex];

  const result = quizData.results[winningKey];

  document.getElementById('result-title').innerText = result.title;
  document.getElementById('result-image').src = result.image;
  document.getElementById('result-description').innerText = result.description;

  const resultContainer = document.getElementById('result-container');
  resultContainer.classList.remove('hidden');
  resultContainer.scrollIntoView({ behavior: 'smooth' });
}