import React, { useState, useEffect } from 'react';
import { View, Text, TouchableWithoutFeedback, StyleSheet, Dimensions, Image } from 'react-native';
import { Powerup, PowerType } from './Powers';
import birdGif from './assets/flying.gif'
import pipe from './assets/flying.gif'

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

const usedPowerUps = new Set();


// Power-up effect duration (5 seconds)
const powerUpDuration = 5000;

export default function App() {
  // Bird's initial position
  const [birdPosition, setBirdPosition] = useState(screenHeight / 2 - birdHeight / 2); // Y's bird pos
  const [gravity, setGravity] = useState(0); // Controls bird's movement (gravity or upward force)
  const [isGameRunning, setIsGameRunning] = useState(false); // Game state (running or not)
  const [score, setScore] = useState(0); // Game score

  const [birdTrail, setBirdTrail] = useState([]);

  const [birdSize, setBirdSize] = useState({ width: birdWidth, height: birdHeight });
  const [powerUpActive, setPowerUpActive] = useState(false);

  const [wallsVisible, setWallsVisible] = useState(true);

  const availablePowerUps = [
    new Powerup(
      "Shrink",
      () => {
        setBirdSize({ width: 10, height: 10 });
      },
      () => {
        setBirdSize({ width: birdWidth, height: birdHeight });
      }
    ),
    new Powerup(
      "Invisible Walls",
      () => {
        setWallsVisible(false);
      },
      () => {
        setWallsVisible(true);
      }
    ),

    new Powerup(
      "Reverse Gravity",
      () => {
        setGravity(-20);
      },
      () => {
        setGravity(10); //  Normal gravity 
      }
    )

  ];

  // Pipes configuration (array of pipe objects)
  const [pipes, setPipes] = useState([
    {
      xPosition: screenWidth, // Pipe's initial x position (offscreen)
      pipeHeight: Math.random() * (screenHeight / 2), // Random height for each pipe
      scored: false,
      hasPowerUp: Math.random() < 0.25
    }
  ]);

  // Resets the game 
  const resetGame = () => {
    setBirdPosition(screenHeight / 2 - birdHeight / 2);
    setGravity(0);
    setIsGameRunning(true);
    setScore(0);
    setPowerUpActive(false);
    setBirdSize({ width: birdWidth, height: birdHeight });
    setPipes([ // Reset pipes 
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
        setBirdPosition((prev) => {
          const newPos = prev + gravity;

          // Update the list of trail positions
          setBirdTrail((prevTrail) => {
            const updatedTrail = [...prevTrail, newPos]; // Adds new position 
            return updatedTrail.length > 10 ? updatedTrail.slice(1) : updatedTrail; // 10 positions
          });

          return newPos;
        });
      }, 30);

      return () => clearInterval(intervalId);
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
    const birdBottom = birdPosition + birdSize.height;
    const birdTop = birdPosition;
    const birdXPosition = screenWidth / 2 - birdSize.width / 2;

    // End game if the bird hits the top of the screen
    if (birdTop <= 0) {
      setIsGameRunning(false);
      return;
    }

    // Check for collisions with pipes and power-ups
    pipes.forEach(pipe => {
      const pipeLeft = pipe.xPosition;
      const pipeRight = pipe.xPosition + pipeWidth;

      // Check if bird is horizontally aligned with a pipe
      if (birdXPosition + birdSize.width > pipeLeft && birdXPosition < pipeRight) {
        const pipeBottomY = pipe.pipeHeight + gapHeight;

        // Ignore collision check if walls are invisible
        if (!wallsVisible) {
          return;
        }

        // Check for collision with the pipe (either top or bottom)
        if (birdTop < pipe.pipeHeight || birdBottom > pipeBottomY) {
          setIsGameRunning(false);
        }
      }

      // Check if the bird touches the power-up
      if (pipe.hasPowerUp) {
        const powerUpX = pipe.xPosition + pipeWidth / 2;
        const powerUpY = pipe.pipeHeight + gapHeight / 2;

        if (
          birdXPosition + birdSize.width > powerUpX - 15 &&
          birdXPosition < powerUpX + 15 &&
          birdBottom > powerUpY - 15 &&
          birdTop < powerUpY + 15
        ) {
          // Activate the power-up
          activatePowerUp();
        }
      }
    });
  }, [birdPosition, pipes, birdSize, wallsVisible]);

  // Function to activate a random power-up
  const activatePowerUp = () => {
    if (!powerUpActive) {
      // Filtrar los power-ups que no han sido usados
      const unusedPowerUps = availablePowerUps.filter(p => !usedPowerUps.has(p.name));

      if (unusedPowerUps.length === 0) {
        // Si todos los power-ups ya fueron usados, reiniciar el Set
        usedPowerUps.clear();
      } else {
        // Elegir uno al azar de los que no se han usado
        const randomIndex = Math.floor(Math.random() * unusedPowerUps.length);
        const selectedPowerUp = unusedPowerUps[randomIndex];

        // Activar el power-up y añadirlo al Set
        usedPowerUps.add(selectedPowerUp.name);
        setPowerUpActive(true);
        selectedPowerUp.activatePower();

        // Desactivar el power-up después de la duración establecida
        setTimeout(() => {
          setPowerUpActive(false);
          selectedPowerUp.disablePower();
        }, powerUpDuration);
      }
    }
  };

  // Render the game view and pipes
  return (
    <TouchableWithoutFeedback onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <View style={styles.container}>

        {/* Bird */}
        <Image
          source={birdGif}
          style={{
            position: 'absolute',
            top: birdPosition,
            width: birdSize.width,
            height: birdSize.height,
            resizeMode: 'contain',
          }}
        />


        {/* Display "Game Over" and "Tap to Start" text when the game is not running */}
        {!isGameRunning && <Text style={styles.gameOver}>Game Over</Text>}
        {!isGameRunning && <Text style={styles.startText}>Tap to Start</Text>}

        {/* Render pipes and power-ups */}
        {pipes.map((pipe, index) => (
          <React.Fragment key={index}>
            {wallsVisible ? (
              <>
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
              </>
            ) : (
              // Invisible walls
              <>
                <View
                  style={{
                    position: 'absolute',
                    left: pipe.xPosition,
                    height: screenHeight - (pipe.pipeHeight + gapHeight),
                    top: pipe.pipeHeight + gapHeight,
                    width: pipeWidth,
                    backgroundColor: 'rgba(0, 0, 0, 0)',
                    borderWidth: 1,
                    borderColor: 'green',
                  }}
                />
                <View
                  style={{
                    position: 'absolute',
                    left: pipe.xPosition,
                    height: pipe.pipeHeight,
                    top: 0,
                    width: pipeWidth,
                    backgroundColor: 'rgba(0, 0, 0, 0)',
                    borderWidth: 1,
                    borderColor: 'green',
                  }}
                />
              </>
            )}

            {/* Render power-ups randomly */}
            {pipe.hasPowerUp && (
              <View
                style={[styles.powerUp, {
                  left: pipe.xPosition + pipeWidth / 2 - 15,
                  top: pipe.pipeHeight + (gapHeight / 2) - 15,
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
    width: 30,
    height: 30,
    backgroundColor: 'blue',
    borderRadius: 15,
  },

  birdTrail: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 0, 0.5)',
    width: birdWidth,
    height: birdHeight,
    borderRadius: birdWidth / 2,
  },
});
