import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Modal, Button, SafeAreaView, FlatList, StatusBar, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { Video } from 'expo-av';
import * as Linking from 'expo-linking';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';

const teachersData = require('./app/teachers.json');
const questionsData = require('./app/questions.json');

const colors = {
  primary: '#43af9b',
  secondary: '#004aad',
  black: '#000000',
  white: '#ffffff',
  gray: '#d3d3d3',
  red: '#ff0000',
};

interface Question {
  question: string;
  answers: string[];
  correctAnswer: string;
}

interface Subcategory {
  subcategory: string;
  questions: Question[];
}

interface Category {
  category: string;
  subcategories: Subcategory[];
}

interface TeachersData {
  teachers: {
    id: string;
    name: string;
    classes: {
      name: string;
      pdfs: { name: string; accessToken: string }[];
      videos: { name: string; accessToken: string }[];
    }[];
  }[];
}

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => {
            let iconName: string = '';
            if (route.name === 'MainApp') {
              iconName = 'book';
            } else if (route.name === 'Game') {
              iconName = 'game-controller';
            }
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: 'gray',
        })}
      >
        <Tab.Screen name="MainApp" component={MainApp} options={{ headerShown: false }} />
        <Tab.Screen name="Game" component={GameScreen} options={{ headerShown: false }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

function MainApp() {
  const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showPDF, setShowPDF] = useState<boolean>(false);
  const [showVideo, setShowVideo] = useState<boolean>(false);
  const [showTeacherSelection, setShowTeacherSelection] = useState<boolean>(true);
  const [showClassSelection, setShowClassSelection] = useState<boolean>(false);

  const handleTeacherSelect = (teacherId: string) => {
    setSelectedTeacher(teacherId);
    setSelectedClass(null);
    setShowTeacherSelection(false);
    setShowClassSelection(true);
  };

  const handleBack = () => {
    setSelectedTeacher(null);
    setSelectedClass(null);
    setShowTeacherSelection(true);
    setShowClassSelection(false);
  };

  const handleClassSelect = (className: string) => {
    setSelectedClass(className);
    setShowClassSelection(false);
  };

  const openPdf = (url: string) => {
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      setPdfUrl(url);
      setShowPDF(true);
    }
  };

  const handleClosePDF = () => {
    setShowPDF(false);
    setPdfUrl(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={styles.statusBar.backgroundColor} />
      <View style={styles.header}>
        <Text style={styles.headerText}>Teacher Selection App</Text>
      </View>
      {showTeacherSelection ? (
        <ScrollView style={styles.scrollView}>
          {teachersData.teachers.map((teacher: any) => (
            <TouchableOpacity
              key={teacher.id}
              style={styles.button}
              onPress={() => handleTeacherSelect(teacher.id)}
            >
              <Text style={styles.buttonText}>{teacher.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : showClassSelection ? (
        <>
          <View style={styles.backButtonContainer}>
            <Button title="Back" onPress={handleBack} color={colors.secondary} />
          </View>
          <ScrollView style={styles.scrollView}>
            {teachersData.teachers
              .find((teacher: any) => teacher.id === selectedTeacher)
              .classes.map((course: any) => (
                <TouchableOpacity
                  key={course.name}
                  style={styles.button}
                  onPress={() => handleClassSelect(course.name)}
                >
                  <Text style={styles.buttonText}>{course.name}</Text>
                </TouchableOpacity>
              ))}
          </ScrollView>
        </>
      ) : selectedClass ? (
        <View style={styles.container}>
          <View style={styles.backButtonContainer}>
            <Button title="Back" onPress={handleBack} color={colors.secondary} />
            <Text style={styles.selectedClass}>{selectedClass}</Text>
          </View>
          <View style={styles.resourcesContainer}>
            <View style={styles.column}>
              <Text style={styles.title}>PDFs:</Text>
              <FlatList
                data={teachersData.teachers
                  .find((teacher: any) => teacher.id === selectedTeacher)
                  .classes.find((course: any) => course.name === selectedClass)
                  .pdfs}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.resource} onPress={() => openPdf(item.accessToken)}>
                    <Text style={styles.resourceText}>{item.name}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
            <View style={styles.column}>
              <Text style={styles.title}>Videos:</Text>
              <FlatList
                data={teachersData.teachers
                  .find((teacher: any) => teacher.id === selectedTeacher)
                  .classes.find((course: any) => course.name === selectedClass)
                  .videos}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.resource} onPress={() => setShowVideo(true)}>
                    <Text style={styles.resourceText}>{item.name}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </View>
      ) : null}

      {pdfUrl && (
        <Modal visible={showPDF} onRequestClose={handleClosePDF}>
          <SafeAreaView style={{ flex: 1 }}>
            <Button title="Close PDF" onPress={handleClosePDF} color={colors.secondary} />
            <WebView source={{ uri: pdfUrl }} style={{ flex: 1 }} />
          </SafeAreaView>
        </Modal>
      )}

      {showVideo && (
        <Modal visible={showVideo} onRequestClose={() => setShowVideo(false)}>
          <SafeAreaView style={{ flex: 1 }}>
            <Button title="Close Video" onPress={() => setShowVideo(false)} color={colors.secondary} />
            <Video
              source={{ uri: teachersData.teachers.find((teacher: any) => teacher.id === selectedTeacher)?.classes.find((course: any) => course.name === selectedClass)?.videos[0]?.accessToken || '' }}
              style={styles.video}
              useNativeControls
              resizeMode={"contain" as any}
            />
          </SafeAreaView>
        </Modal>
      )}
    </SafeAreaView>
  );
}

function GameScreen() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerStatus, setAnswerStatus] = useState<string | null>(null);
  const [shuffledAnswers, setShuffledAnswers] = useState<string[]>([]);
  const [timer, setTimer] = useState<number>(10);
  const [points, setPoints] = useState<number>(0);
  const [showScore, setShowScore] = useState<boolean>(false);
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [correctAnswersCount, setCorrectAnswersCount] = useState<number>(0);
  const [incorrectQuestions, setIncorrectQuestions] = useState<Question[]>([]);
  const [unansweredQuestions, setUnansweredQuestions] = useState<Question[]>([]);

  useEffect(() => {
    if (selectedSubcategory) {
      handleShowGame();
    }
  }, [selectedSubcategory]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  useEffect(() => {
    if (timer === 0) {
      handleNextQuestion(true);
    }
  }, [timer]);

  const handleShowGame = () => {
    const category = questionsData.categories.find((cat: Category) => cat.category === selectedCategory);
    const subcategoryQuestions = category?.subcategories.find((subcat: Subcategory) => subcat.subcategory === selectedSubcategory)?.questions || [];
    const shuffledQuestionsArray = shuffleArray([...subcategoryQuestions]).slice(0, 20); // Limit to 20 questions
    setShuffledQuestions(shuffledQuestionsArray);
    setShowScore(false);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setAnswerStatus(null);
    setPoints(0);
    setCorrectAnswersCount(0);
    setIncorrectQuestions([]);
    setUnansweredQuestions([]);
    if (shuffledQuestionsArray.length > 0) {
      shuffleAnswers(shuffledQuestionsArray[0].answers);
    }
    setTimer(10);
  };

  const handleAnswerSelect = (answer: string) => {
    if (!currentQuestion) return;

    setSelectedAnswer(answer);
    if (answer === currentQuestion.correctAnswer) {
      setAnswerStatus('Correct answer');
      setPoints((prevPoints) => prevPoints + timer);
      setCorrectAnswersCount((prevCount) => prevCount + 1);
    } else {
      setAnswerStatus('Wrong answer');
      setIncorrectQuestions((prevQuestions) => [...prevQuestions, currentQuestion]);
    }
    setTimeout(() => {
      handleNextQuestion(false);
    }, 1000);
  };

  const handleNextQuestion = (isUnanswered: boolean) => {
    if (isUnanswered && selectedAnswer === null && currentQuestion) {
      setUnansweredQuestions((prevQuestions) => [...prevQuestions, currentQuestion]);
    }
    if (currentQuestionIndex < shuffledQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setAnswerStatus(null);
      shuffleAnswers(shuffledQuestions[currentQuestionIndex + 1].answers);
      setTimer(10);
    } else {
      setShowScore(true);
    }
  };

  const shuffleAnswers = (answers: string[]) => {
    const shuffled = shuffleArray([...answers]);
    setShuffledAnswers(shuffled);
  };

  const shuffleArray = (array: any[]) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  const handleQuitGame = () => {
    setSelectedCategory(null);
    setSelectedSubcategory(null);
  };

  const currentQuestion: Question | undefined = shuffledQuestions[currentQuestionIndex];

  return (
    <View style={styles.gameContainer}>
      {selectedCategory === null ? (
        <ScrollView style={styles.scrollView}>
          {questionsData.categories.map((category: Category, index: number) => (
            <TouchableOpacity
              key={index}
              style={styles.button}
              onPress={() => setSelectedCategory(category.category)}
            >
              <Text style={styles.buttonText}>{category.category}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : selectedSubcategory === null ? (
        <ScrollView style={styles.scrollView}>
          {questionsData.categories
            .find((category: Category) => category.category === selectedCategory)
            ?.subcategories?.map((subcategory: Subcategory, index: number) => (
              <TouchableOpacity
                key={index}
                style={styles.button}
                onPress={() => setSelectedSubcategory(subcategory.subcategory)}
              >
                <Text style={styles.buttonText}>{subcategory.subcategory}</Text>
              </TouchableOpacity>
            ))}
        </ScrollView>
      ) : showScore ? (
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>Your Score: {points}</Text>
          <Text style={styles.scoreText}>You answered correctly {correctAnswersCount} out of {shuffledQuestions.length} questions</Text>
          <Text style={styles.scoreText}>Incorrect Questions:</Text>
          {incorrectQuestions.map((question, index) => (
            <Text key={index} style={styles.questionText}>{question.question}</Text>
          ))}
          <Text style={styles.scoreText}>Unanswered Questions:</Text>
          {unansweredQuestions.map((question, index) => (
            <Text key={index} style={styles.questionText}>{question.question}</Text>
          ))}
          <TouchableOpacity style={styles.button} onPress={handleQuitGame}>
            <Text style={styles.buttonText}>Choose Another Game</Text>
          </TouchableOpacity>
        </View>
      ) : (
        currentQuestion && (
          <>
            <Text style={styles.questionText}>{currentQuestion.question}</Text>
            <Text style={styles.timerText}>Time left: {timer}s</Text>
            <View style={styles.answersContainer}>
              {shuffledAnswers.map((answer: string, index: number) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.answerButton,
                    selectedAnswer === answer && answer !== currentQuestion.correctAnswer && styles.wrongAnswerButton,
                    selectedAnswer === answer && answer === currentQuestion.correctAnswer && styles.correctAnswerButton,
                  ]}
                  onPress={() => handleAnswerSelect(answer)}
                  disabled={!!selectedAnswer}
                >
                  <Text style={styles.answerButtonText}>{answer}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {answerStatus && <Text style={styles.answerStatus}>{answerStatus}</Text>}
            <View style={styles.statusContainer}>
              <Text style={styles.statusText}>Questions Finished: {currentQuestionIndex + 1}/{shuffledQuestions.length}</Text>
            </View>
            <Button title="Quit Game" onPress={handleQuitGame} color={colors.red} />
          </>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 20,
    paddingTop: 40,
    borderWidth: 1,
    borderColor: colors.gray,
  },
  scrollView: {
    flex: 1,
    width: '100%',
    borderWidth: 1,
    borderColor: colors.gray,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: colors.secondary,
    borderWidth: 1,
    borderColor: colors.gray,
    padding: 10,
  },
  button: {
    backgroundColor: colors.secondary,
    padding: 10,
    marginVertical: 5,
    borderRadius: 5,
    width: '100%',
    borderWidth: 1,
    borderColor: colors.gray,
  },
  buttonText: {
    color: colors.white,
    textAlign: 'center',
    fontSize: 16,
  },
  resource: {
    backgroundColor: colors.primary,
    padding: 10,
    marginVertical: 5,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: colors.gray,
  },
  resourceText: {
    color: colors.white,
    textAlign: 'center',
    fontSize: 16,
  },
  backButtonContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    width: '100%',
    borderWidth: 1,
    borderColor: colors.gray,
    padding: 10,
  },
  selectedClass: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 20,
    color: colors.primary,
    borderWidth: 1,
    borderColor: colors.gray,
    padding: 10,
  },
  video: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.gray,
  },
  resourcesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: colors.gray,
    padding: 10,
  },
  column: {
    flex: 1,
    marginHorizontal: 10,
    borderWidth: 1,
    borderColor: colors.gray,
    padding: 10,
  },
  statusBar: {
    backgroundColor: colors.primary,
  },
  header: {
    width: '100%',
    padding: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.gray,
    borderWidth: 1,
    borderColor: colors.gray,
  },
  headerText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  gameContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderWidth: 1,
    borderColor: colors.gray,
  },
  scoreContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.gray,
    padding: 20,
  },
  scoreText: {
    fontSize: 20,
    color: colors.secondary,
    padding: 5,
    fontWeight: '600',
  },
  questionText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: colors.secondary,
    textAlign: 'center',
  },
  answersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  answerButton: {
    backgroundColor: colors.primary,
    padding: 10,
    margin: 5,
    borderRadius: 5,
    width: '45%',
    borderWidth: 1,
    borderColor: colors.gray,
  },
  correctAnswerButton: {
    backgroundColor: colors.primary,
  },
  wrongAnswerButton: {
    backgroundColor: colors.red,
  },
  answerButtonText: {
    color: colors.white,
    textAlign: 'center',
    fontSize: 16,
  },
  answerStatus: {
    fontSize: 16,
    color: colors.black,
    marginTop: 20,
  },
  timerText: {
    fontSize: 16,
    color: colors.black,
    marginBottom: 10,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
    width: '100%',
  },
  statusText: {
    fontSize: 16,
    color: colors.secondary,
  },
});
