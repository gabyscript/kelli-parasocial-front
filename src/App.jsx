import { useState, useEffect } from 'react'

import { io } from 'socket.io-client'
import { Container , Row, Col} from 'react-bootstrap'

import './App.css'

function App() {

  const BASE_URL = import.meta.env.VITE_BASE_URL
  const socket = io(BASE_URL);

  const [revealedWords , setRevealedWords] = useState([])
  let [timer, setTimer] = useState(4)
  let [isTimerRunning, setIsTimerRunning] = useState(false)
  let [questionsData, setQuestionsData] = useState()
  let [currentQuestion, setCurrentQuestion] = useState()
  let [id, setId] = useState(1)

  useEffect(() =>{

    const fetchQuestions = async () => {
      try {
          const response = await fetch('./questions.json');
          const data = await response.json();          

          let singleQuestion = data.find(x => x.id === id);
          
          setQuestionsData(data)
          setCurrentQuestion(singleQuestion)
      } catch (error) {
          console.error("Error al momento de cargar los datos", error)
      }
    };

    fetchQuestions();

  }, [])

  useEffect(()=> {

    socket.on('connect', () => {
      console.log(`You connected with id: ${socket.id}`)
    }) 

  }, []) 

  function startTimer(){

    setIsTimerRunning(true);

    socket.emit("setRunningTrue", isTimerRunning)

    const interval = setInterval(() => {      
           
      socket.emit("ongoingTimer", timer)

      if (timer === 0) {
        clearInterval(interval);
        
        setIsTimerRunning(false)

        socket.emit("setRunningFalse", isTimerRunning)
      }

      
    }, 1000);
  }

  function revealCorrectAnswer(answer){
    setRevealedWords([...revealedWords, answer])

    socket.emit("revealCorrectAnswer", answer)
  }

  function setNextQuestion(){
    
    if(id == questionsData.length) {
      return
    }

    setId(++id)

    let nextQuestion = questionsData.find(x => x.id === id)    

    socket.emit("goNextQuestion", 4,nextQuestion)
  }

  socket.on("sendTrueValue", boolValue => {
    setIsTimerRunning(true)
  })

  socket.on("receiveTimer", currentTimer => {
    if(timer > 0) {
      setTimer(--timer)
    }
  })
  
  socket.on("receiveAnswer", answer => {
    setRevealedWords([...revealedWords, answer])
  })

  socket.on("sendFalseValue", boolValue => {
    setIsTimerRunning(boolValue)
  })
  
  socket.on("sendNewValues", (initialTimer, question) => {
    setTimer(initialTimer)
    setCurrentQuestion(question)
  })

  
  
  return (
    <>
      <Container fluid className='bg-dark container-prueba py-5 px-2'>
        <Row>
          <Col xl={1} lg={1}>
            <h5 className='text-white text-center'>
              Ptos:
            </h5>
          </Col>
          <Col xl={10} lg={10}>
            <h5 className='text-white text-center'>
              {currentQuestion?.question}
            </h5>
          </Col>
          <Col xl={1} lg={1}>
            <h5 className='text-white text-center'>
              {timer}
            </h5>
          </Col>
        </Row>
        <Row className='mt-3'>
          <Col className='d-flex justify-content-center align-items-center'>
          {isTimerRunning === false && timer > 0 && (
            <button className="btn btn-primary w-25" onClick={() => startTimer()}>
              Comenzar
            </button>
          ) }
          {isTimerRunning === false && timer === 0 && (
            <button className="btn btn-primary w-25" onClick={() => setNextQuestion()}>
              Siguiente pregunta
            </button>
          )}
          </Col>          
        </Row>
        {currentQuestion?.answers?.map((word, index) => {
          return (
            <Row className='mt-5' key={index}>
              <Col className='d-flex justify-content-center align-items-center'>
                <button className="btn btn-primary w-50" key={index} onClick={() => revealCorrectAnswer(word)}  >
                    {revealedWords.includes(word) ? word : word[0]}
                </button>
              </Col>
            </Row>
            )        
        })}
      </Container>
      
    </>
  )
}

export default App
