# Framer Motion Animation Logic & Tutorial

## 1. Core Concepts

### Basic Animation Structure
```jsx
<motion.div
  initial={{}}     // Starting state
  animate={{}}     // End state
  transition={{}}  // How to animate between them
>
  Content
</motion.div>
```

## 2. Our Circular Glow Animation Breakdown

### Step 1: Animation Variants (Reusable Animation States)
```jsx
const circleVariants = {
  hidden: { 
    scale: 1  // Starting: normal size
  },
  visible: { 
    scale: [1, 1.05, 1.1, 1.05, 1],  // Array = keyframes
    transition: {
      duration: 0.8,     // How long each animation takes
      ease: "easeInOut"  // Animation curve
    }
  }
};

const glowEffectVariants = {
  hidden: { 
    opacity: 0,  // Starting: invisible
    scale: 1
  },
  visible: { 
    opacity: [0, 0.9, 1, 0.9, 0],     // Fade in → peak → fade out
    scale: [1, 1.3, 1.6, 1.3, 1],     // Grow → peak → shrink
    transition: {
      duration: 0.8,
      ease: "easeInOut"
    }
  }
};
```

**Key Points:**
- `variants` = Reusable animation presets
- `[1, 1.05, 1.1, 1.05, 1]` = Keyframes (like CSS keyframes)
- Each number is a step in the animation timeline

### Step 2: Container Animation (Controls Sequence)
```jsx
const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.8,    // Wait 0.8s between each child
      repeat: Infinity,        // Loop forever
      repeatDelay: 0.5        // Pause 0.5s before restarting
    }
  }
};
```

**How Stagger Works:**
- Child 1: starts at 0s
- Child 2: starts at 0.8s  
- Child 3: starts at 1.6s
- Child 4: starts at 2.4s
- Child 5: starts at 3.2s
- Child 6: starts at 4.0s
- Then repeats infinitely

### Step 3: Applying Animations
```jsx
{/* Parent container controls the sequence */}
<motion.div
  variants={containerVariants}
  initial="hidden"
  animate="visible"
>
  {/* Each child gets animated in sequence */}
  {circleImages.map((image, index) => (
    <motion.div
      key={image.id}
      variants={circleVariants}  // Uses the scale animation
      custom={index}             // Passes index for customization
    >
      {/* Glow layer */}
      <motion.div
        variants={glowEffectVariants}  // Uses the opacity/scale glow
        custom={index}
      />
      
      {/* Main image */}
      <div>{/* image content */}</div>
    </motion.div>
  ))}
</motion.div>
```

## 3. Mathematical Circle Positioning

### Circle Math Explained
```jsx
const radius = 300;  // Distance from center
const circleImages = [
  { angle: 0 },    // 12 o'clock
  { angle: 60 },   // 2 o'clock  
  { angle: 120 },  // 4 o'clock
  { angle: 180 },  // 6 o'clock
  { angle: 240 },  // 8 o'clock
  { angle: 300 }   // 10 o'clock
];

// Convert to x,y coordinates
const angleInRadians = (image.angle * Math.PI) / 180;
const x = Math.cos(angleInRadians) * radius;  // Horizontal position
const y = Math.sin(angleInRadians) * radius;  // Vertical position
```

**Visual Representation:**
```
      (0°)
        ●
   ●         ● (60°)
(300°)   ●   (120°)
   ●         ●
      (180°)
```

### Positioning Logic
```jsx
style={{
  left: `calc(50% + ${x}px - 3.5rem)`,   // Center + offset - half_image_size
  top: `calc(50% + ${y}px - 3.5rem)`,    // Center + offset - half_image_size
}}
```

## 4. Common Animation Properties

### Transform Properties
```jsx
animate={{
  x: 100,           // Move right 100px
  y: -50,           // Move up 50px
  scale: 1.5,       // Make 1.5x bigger
  rotate: 45,       // Rotate 45 degrees
  opacity: 0.5,     // Make 50% transparent
}}
```

### Transition Options
```jsx
transition={{
  duration: 2,           // Animation takes 2 seconds
  delay: 0.5,           // Wait 0.5s before starting
  ease: "easeInOut",    // Animation curve
  repeat: Infinity,     // Loop forever
  repeatType: "reverse", // Go back and forth
  repeatDelay: 1,       // Pause 1s between loops
}}
```

### Easing Options
- `"linear"` - Constant speed
- `"easeIn"` - Slow start, fast end
- `"easeOut"` - Fast start, slow end  
- `"easeInOut"` - Slow start and end
- `[0.4, 0, 0.2, 1]` - Custom cubic bezier

## 5. Animation Patterns You Can Try

### 1. Bounce Effect
```jsx
const bounceVariants = {
  hidden: { y: -100, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: {
      type: "spring",
      damping: 10,
      stiffness: 100
    }
  }
};
```

### 2. Fade & Slide
```jsx
const slideVariants = {
  hidden: { x: -100, opacity: 0 },
  visible: { 
    x: 0, 
    opacity: 1,
    transition: { duration: 0.6 }
  }
};
```

### 3. Rotation Animation
```jsx
const rotateVariants = {
  hidden: { rotate: 0 },
  visible: { 
    rotate: 360,
    transition: { 
      duration: 2,
      ease: "linear",
      repeat: Infinity
    }
  }
};
```

### 4. Pulse Effect
```jsx
const pulseVariants = {
  hidden: { scale: 1 },
  visible: {
    scale: [1, 1.1, 1],
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};
```

## 6. Advanced Techniques

### Custom Animation with useAnimation
```jsx
import { useAnimation } from 'framer-motion';

const controls = useAnimation();

// Trigger custom animation
const startAnimation = () => {
  controls.start({
    scale: 2,
    rotate: 180,
    transition: { duration: 1 }
  });
};

<motion.div animate={controls} />
```

### Gesture Animations
```jsx
<motion.div
  whileHover={{ scale: 1.1 }}      // On mouse hover
  whileTap={{ scale: 0.9 }}        // On click/tap
  whileDrag={{ rotate: 30 }}       // While dragging
  drag                             // Make it draggable
/>
```

### Exit Animations
```jsx
<AnimatePresence>
  {isVisible && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}        // Animation when removed
    />
  )}
</AnimatePresence>
```

## 7. Debugging Tips

### View Animation States
```jsx
<motion.div
  animate={{ x: 100 }}
  onAnimationStart={() => console.log("Animation started")}
  onAnimationComplete={() => console.log("Animation finished")}
/>
```

### Control Animations Conditionally
```jsx
const [isAnimating, setIsAnimating] = useState(true);

<motion.div
  animate={isAnimating ? "visible" : "hidden"}
  variants={myVariants}
/>
```

## 8. Performance Tips

1. **Use `transform` properties** (scale, rotate, x, y) - they're GPU accelerated
2. **Avoid animating** `width`, `height`, `top`, `left` - use transform instead
3. **Use `will-change: transform`** for complex animations
4. **Reduce motion** for users who prefer it:

```jsx
const shouldReduceMotion = useReducedMotion();

<motion.div
  animate={shouldReduceMotion ? {} : { rotate: 360 }}
/>
```

## 9. Your Specific Animation Explained

In your circular glow animation:

1. **Container** starts all animations with `staggerChildren`
2. **Each circle** waits its turn (0.8s apart)
3. **When triggered**, each circle runs both:
   - `circleVariants` (subtle scale effect)
   - `glowEffectVariants` (opacity + scale glow)
4. **Glow layers** create the visual effect with CSS gradients
5. **Math positioning** keeps circles in perfect formation
6. **Loop infinitely** with `repeat: Infinity`

## 10. Customization Examples

Want the glow to be red instead of green?
```jsx
background: 'radial-gradient(circle, rgba(239, 68, 68, 0.7) 0%, ...)'
```

Want faster animation?
```jsx
staggerChildren: 0.4,  // Instead of 0.8
duration: 0.4         // Instead of 0.8
```

Want different sequence (spiral instead of clockwise)?
```jsx
const spiralOrder = [0, 3, 1, 4, 2, 5]; // Custom order
// Apply custom index mapping
```

This should give you a solid foundation to modify and create your own Framer Motion animations! The key is understanding variants, transitions, and how staggerChildren creates sequences.