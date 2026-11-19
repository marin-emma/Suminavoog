let quizData = null;       
let scores = {};          
let selectedAnswers = {}; 
let currentQuizColor = '#F050AE';

const randomColors = [
  '#33A8C7',
  '#23A6A4',
  '#6DA614', 
  '#C79A00', 
  '#D98600', 
  '#E05A57', 
  '#F050AE', 
  '#B65CE0', 
  '#9336FD', 
  '#9F45E8',
  '#C448B6',
  '#E04877',
  '#D96E18',
  '#8AA814',
  '#38A846',
  '#229AA8'
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
    const creditLine = quiz.credit
      ? `<small style="color: #666; font-style: italic; display: block; margin-top: 4px;">${quiz.credit}</small>`
      : '';

    html += `
      <a href="quiz.html?test=${quiz.id}" class="quiz-preview-card">
        <img src="${quiz.image}" alt="${quiz.title}">
        <div class="card-text">
          <h3>${quiz.title}</h3>
          ${creditLine}
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

      quizData.questions.forEach(q => {
        q.options.sort(() => Math.random() - 0.5);
      });                        

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

  currentQuizColor = randomColors[Math.floor(Math.random() * randomColors.length)];

  quizData.questions.forEach((q, qIndex) => {
    html += `
      <div class="question-block" id="q-${qIndex}">
        <div class="question-box" style="background-color: ${currentQuizColor}; color: #FFFFFF;">
          <h3 class="question-title">${q.text}</h3>
        </div>

        <div class="options-grid">
          ${q.options.map((opt, optIndex) => {
            const btnStyle = opt.image 
              ? `style="background-image: url('${opt.image}');"` 
              : `style="background-color: ${currentQuizColor}; color: #FFFFFF;"`;
            const btnClass = opt.image ? 'option-btn has-option-img' : 'option-btn';

            const creditHtml = (opt.image && opt.credit)
              ? `<span class="img-credit">${opt.credit}</span>`
              : '';

            return `
              <button type="button" class="${btnClass}" ${btnStyle} onclick="selectOption(${qIndex},${optIndex})">
                ${creditHtml}
                <span class="option-text">${opt.text}</span>
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
  const gridEL = questionBlock.querySelector('.options-grid');
  gridEL.classList.add('has-selection');

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

  const resultTitle = document.getElementById('result-title');
  resultTitle.innerText = result.title;
  document.getElementById('result-image').src = result.image;
  document.getElementById('result-description').innerText = result.description;

  const resultImgBox = document.querySelector('.result-image-box');
  const oldCredit = resultImgBox.querySelector('.img-credit');
  if (oldCredit) oldCredit.remove();

  if (result.credit) {
    const creditSpan = document.createElement('span');
    creditSpan.className = 'img-credit';
    creditSpan.innerText = result.credit;
    resultImgBox.appendChild(creditSpan);
  }

  const resultContainer = document.getElementById('result-container');

  resultContainer.style.backgroundColor = currentQuizColor;
  resultContainer.style.border = currentQuizColor;
  resultContainer.style.color = '#FFFFFF';

  resultTitle.style.backgroundColor = '#FFFFFF';
  resultTitle.style.color = '#1A1A1A'

  resultContainer.classList.remove('hidden');
  resultContainer.scrollIntoView({ behavior: 'smooth' });
}