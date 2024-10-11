import React, { useState, useEffect } from 'react';
import { View, Text, TouchableWithoutFeedback, StyleSheet, Dimensions } from 'react-native';

// Get screen dimensions
const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

// Bird dimensions
const birdWidth = 30;
const birdHeight = 30;

// Pipe dimensions and gap
const pipeWidth = 50;
const gapHeight = 175;
const pipeSpeed = 5; // Speed at which pipes move

export default function App() {
  // Bird's initial position
  const [birdPosition, setBirdPosition] = useState(screenHeight / 2 - birdHeight / 2);
  const [gravity, setGravity] = useState(0); // Controls bird's movement (gravity or upward force)
  const [isGameRunning, setIsGameRunning] = useState(false); // Game state (running or not)
  const [score, setScore] = useState(0); // Game score

  // Pipes configuration (array of pipe objects)
  const [pipes, setPipes] = useState([
    {
      xPosition: screenWidth, // Pipe's initial x position (offscreen)
      pipeHeight: Math.random() * (screenHeight / 2), // Random height for each pipe
      scored: false, // Whether the player has passed this pipe (to update score)
      hasPowerUp: Math.random() < 0.25 // Randomly assign a power-up
    }
  ]);

  // Resets the game when it starts or when the game over condition is met
  const resetGame = () => {
    setBirdPosition(screenHeight / 2 - birdHeight / 2); // Reset bird's position
    setGravity(0); // No initial gravity when the game is reset
    setIsGameRunning(true); // Start the game
    setScore(0); // Reset score
    setPipes([ // Reset pipes to a new configuration
      {
        xPosition: screenWidth,
        pipeHeight: Math.random() * (screenHeight / 2),
        scored: false,
      }
    ]);
  };

  // Handles the bird's movement by updating its position based on gravity or upward force
  useEffect(() => {
    if (isGameRunning) {
      const intervalId = setInterval(() => {
        setBirdPosition((prev) => prev + gravity); // Update bird's position
      }, 30); // Movement interval
      return () => clearInterval(intervalId); // Clear the interval when not running
    }
  }, [isGameRunning, gravity]);

  // Handles pipe movement and score updates
  useEffect(() => {
    if (isGameRunning) {
      const intervalId = setInterval(() => {
        setPipes((prevPipes) => {
          // Move pipes to the left
          let newPipes = prevPipes.map(pipe => ({
            ...pipe,
            xPosition: pipe.xPosition - pipeSpeed // Move pipe to the left
          }));

          const birdXPosition = screenWidth / 2 - birdWidth / 2; // Bird's x-position

          // Update score when bird passes a pipe
          newPipes = newPipes.map(pipe => {
            if (!pipe.scored && birdXPosition > pipe.xPosition + pipeWidth) {
              setScore(prevScore => prevScore + 1); // Increment score
              pipe.scored = true; // Mark pipe as passed
            }
            return pipe;
          });

          // Remove pipes that go off-screen
          if (newPipes[0].xPosition + pipeWidth < 0) {
            newPipes.shift();
          }

          // Add new pipes as old ones move out of view
          if (newPipes[newPipes.length - 1].xPosition < screenWidth - 300) {
            newPipes.push({
              xPosition: screenWidth,
              pipeHeight: Math.random() * (screenHeight / 2),
              scored: false,
              hasPowerUp: Math.random() < 0.25 // Random chance for a power-up
            });
          }

          return newPipes; // Update pipes state
        });
      }, 30);

      return () => clearInterval(intervalId); // Clear the interval when not running
    }
  }, [isGameRunning]);

  // Handle touch event when screen is pressed
  const handlePressIn = () => {
    if (!isGameRunning) {
      resetGame(); // Start the game if not running
    } else {
      setGravity(-10); // Move bird up while touching the screen
    }
  };

  // Handle touch event when screen is released
  const handlePressOut = () => {
    setGravity(10); // Apply gravity to move bird down when screen is released
  };

  // Detect collisions and check if the bird goes out of bounds
  useEffect(() => {
    const birdBottom = birdPosition + birdHeight; // Bird's bottom y-position
    const birdTop = birdPosition; // Bird's top y-position
    const birdXPosition = screenWidth / 2 - birdWidth / 2; // Bird's x-position

    // End game if the bird hits the top of the screen
    if (birdTop <= 0) {
      setIsGameRunning(false);
      return;
    }

    // Check for collisions with pipes
    pipes.forEach(pipe => {
      const pipeLeft = pipe.xPosition;
      const pipeRight = pipe.xPosition + pipeWidth;

      // Check if bird is horizontally aligned with a pipe
      if (birdXPosition + birdWidth > pipeLeft && birdXPosition < pipeRight) {
        const pipeBottomY = pipe.pipeHeight + gapHeight;
        // Check for collision with the pipe (either top or bottom)
        if (birdTop < pipe.pipeHeight || birdBottom > pipeBottomY) {
          setIsGameRunning(false); // End game if collision detected
        }
      }
    });

  }, [birdPosition, pipes]);

  // Render the game view and pipes
  return (
    <TouchableWithoutFeedback onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <View style={styles.container}>
        {/* Bird */}
        <View style={[styles.bird, { top: birdPosition }]} />

        {/* Display "Game Over" and "Tap to Start" text when the game is not running */}
        {!isGameRunning && <Text style={styles.gameOver}>Game Over</Text>}
        {!isGameRunning && <Text style={styles.startText}>Tap to Start</Text>}

        {/* Render pipes and power-ups */}
        {pipes.map((pipe, index) => (
          <React.Fragment key={index}>
            <View
              style={[styles.pipe, {
                left: pipe.xPosition,
                height: screenHeight - (pipe.pipeHeight + gapHeight),
                top: pipe.pipeHeight + gapHeight,
                width: pipeWidth
              }]}
            />
            <View
              style={[styles.pipe, {
                left: pipe.xPosition,
                height: pipe.pipeHeight,
                top: 0,
                width: pipeWidth
              }]}
            />

            {/* Render power-ups randomly */}
            {pipe.hasPowerUp && (
              <View
                style={[styles.powerUp, {
                  left: pipe.xPosition + pipeWidth / 2 - birdWidth / 2,
                  top: pipe.pipeHeight + (gapHeight / 2) - birdHeight / 2,
                }]}
              />
            )}
          </React.Fragment>
        ))}

        {/* Display current score */}
        <Text style={styles.score}>Score: {score}</Text>

      </View>
    </TouchableWithoutFeedback>
  );
}

// Styles for various components in the game
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#70c5ce',
    justifyContent: 'center',
    alignItems: 'center',
  },

  bird: {
    position: 'absolute',
    backgroundColor: 'yellow',
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
    top: screenHeight / 2 + 50,
    fontSize: 20,
    color: 'black',
  },

  pipe: {
    position: 'absolute',
    backgroundColor: 'green',
  },

  score: {
    position: 'absolute',
    top: 50,
    fontSize: 24,
    color: 'white',
  },

  powerUp: {
    position: 'absolute',
    width: birdWidth,
    height: birdHeight,
    backgroundColor: 'blue',
    borderRadius: birdWidth / 2,
  }
});
