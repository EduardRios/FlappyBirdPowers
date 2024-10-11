import React, { useState, useEffect } from 'react';
import { View, Text, TouchableWithoutFeedback, StyleSheet, Dimensions } from 'react-native';

// Get the screen dimensions
const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;
const birdWidth = 30;
const birdHeight = 30;

const pipeWidth = 50;
const gapHeight = 150; // Gap between pipes
const pipeSpeed = 5; // Speed at which pipes move to the left

export default function App() {
  // State for the bird's position
  const [birdPosition, setBirdPosition] = useState(screenHeight / 2 - birdHeight / 2); // Start in the center
  const [gravity, setGravity] = useState(0); // Start with no gravity
  const [isGameRunning, setIsGameRunning] = useState(false); // If the game is active

  const [score, setScore] = useState(0); // Counter for score


  // Pipes state: array of pipe objects { xPosition, height, scored }
  const [pipes, setPipes] = useState([
    {
      xPosition: screenWidth, // Start the pipe at the right edge of the screen
      pipeHeight: Math.random() * (screenHeight / 2), // Random height for the first pipe
      scored: false 
    }
  ]);

  // Function to reset the game
  const resetGame = () => {
    setBirdPosition(screenHeight / 2 - birdHeight / 2); // Reset the bird to the center
    setGravity(0); // Reset gravity to 0
    setIsGameRunning(true); // Start the game
    setScore(0);
    setPipes([
      {
        xPosition: screenWidth,
        pipeHeight: Math.random() * (screenHeight / 2),
        scored: false 
      }
    ]); // Reset pipes
  };

  // Effect to make the bird fall
  useEffect(() => {
    if (isGameRunning) {
      const intervalId = setInterval(() => {
        setBirdPosition((prev) => prev + gravity);
      }, 30);
      return () => clearInterval(intervalId);
    }
  }, [isGameRunning, gravity]);

  // Effect to move pipes and generate new ones
  useEffect(() => {
    if (isGameRunning) {
      const intervalId = setInterval(() => {
        setPipes((prevPipes) => {
          let newPipes = prevPipes.map(pipe => ({
            ...pipe,
            xPosition: pipe.xPosition - pipeSpeed // Move each pipe to the left
          }));

          const birdXPosition = screenWidth / 2 - birdWidth / 2; // Bird X pos
          
          newPipes = newPipes.map(pipe => {
            // Verifies if bird overpasses the coming pipes.
            if (!pipe.scored && birdXPosition > pipe.xPosition + pipeWidth) {
              // Score goes up if bird passes the right end of pipe.
              setScore(prevScore => prevScore + 1);
              pipe.scored = true; // Bird overpass the pipe 
            }
            return pipe;
          });

          // Check if the first pipe has gone off screen, if so, remove it
          if (newPipes[0].xPosition + pipeWidth < 0) {
            newPipes.shift(); // Remove the first pipe
          }

          // Add a new pipe when the last one is far enough to the left
          if (newPipes[newPipes.length - 1].xPosition < screenWidth - 300) {
            newPipes.push({
              xPosition: screenWidth,
              pipeHeight: Math.random() * (screenHeight / 2), // Random height for the new pipe
              scored: false 
            });
          }

          return newPipes;
        });
      }, 30);

      return () => clearInterval(intervalId);
    }
  }, [isGameRunning]);

  // Handle tap to jump
  const handleTap = () => {
    if (!isGameRunning) {
      resetGame(); // Restart the game if not active
    } else {
      setGravity(5); // Apply gravity when tapping
      setBirdPosition((prev) => Math.max(prev - 50, 0)); // Jump (go up), but don't go off the screen
    }
  };

  // Effect to check for collisions with the ground and the ceiling
  useEffect(() => {
    const birdBottom = birdPosition + birdHeight;
    const birdTop = birdPosition;
    const birdXPosition = screenWidth / 2 - birdWidth / 2;

    // Checks if bird touches ceiling.
    if (birdTop <= 0) {
      setIsGameRunning(false); // End game.
      return;
    }

    pipes.forEach(pipe => {
      const pipeLeft = pipe.xPosition;
      const pipeRight = pipe.xPosition + pipeWidth;

      // Check if the bird is within the horizontal range of a pipe
      if (birdXPosition + birdWidth > pipeLeft && birdXPosition < pipeRight) {
        // Now check if it's colliding vertically with either the top or bottom pipe
        const pipeBottomY = pipe.pipeHeight + gapHeight;
        if (birdTop < pipe.pipeHeight || birdBottom > pipeBottomY) {
          setIsGameRunning(false); // End game if collision happens
        }
      }
    });

  }, [birdPosition, pipes]);

  //All the visuals.
  return (
    <TouchableWithoutFeedback onPress={handleTap}>
      <View style={styles.container}>
        {/* Bird */}
        <View style={[styles.bird, { top: birdPosition }]} />

        {/* Game Over text */}  
        {!isGameRunning && <Text style={styles.gameOver}>Game Over</Text>}
        {!isGameRunning && <Text style={styles.startText}>Tap to Start</Text>}

        {/* Pipes */}
        {pipes.map((pipe, index) => (
          <React.Fragment key={index}>
            {/* Bottom Pipe */}
            <View
              style={[styles.pipe, {
                left: pipe.xPosition,
                height: screenHeight - (pipe.pipeHeight + gapHeight),
                top: pipe.pipeHeight + gapHeight,
                width: pipeWidth
              }]}
            />
            {/* Top Pipe */}
            <View
              style={[styles.pipe, {
                left: pipe.xPosition,
                height: pipe.pipeHeight,
                top: 0,
                width: pipeWidth
              }]}
            />
          </React.Fragment>
        ))}

        <Text style={styles.score}>Score: {score}</Text>

      </View>
    </TouchableWithoutFeedback>
  );

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#70c5ce', // Background color (sky)
    justifyContent: 'center',
    alignItems: 'center',
  },
  bird: {
    position: 'absolute',
    backgroundColor: 'yellow', // Yellow rectangle for the bird
    width: birdWidth,
    height: birdHeight,
  },
  gameOver: {
    position: 'absolute',
    zIndex: 10,
    top: screenHeight / 2 - 20,
    fontSize: 40,
    color: 'red',
    fontWeight: 'bold',
  },
  startText: {
    position: 'absolute',
    zIndex: 10,
    top: screenHeight / 2 + 30,
    fontSize: 20,
    color: 'white',
  },
  pipe: {
    position: 'absolute',
    backgroundColor: 'green',
  },

  score: {
    position: 'absolute',
    zIndex: 10,
    top: screenHeight / 2 + 60,
    fontSize: 20,
    color: 'black',
  }
});
