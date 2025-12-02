import { useEffect, useRef, useState } from 'react'
import {
  engineInit,
  EngineObject,
  Vector2,
  Color,
  keyWasPressed,
  drawRect,
  drawLine,
  drawCircle,
  cameraPos,
  timeDelta,
  setCanvasClearColor,
  engineObjects,
  engineObjectsCollect,
  WHITE,
  RED,
  BLUE,
  GREEN,
  YELLOW,
  GRAY,
  ORANGE,
} from 'littlejsengine'
import './Game.css'
import { MenuScreen } from './MenuScreen'
import { GameOverScreen } from './GameOverScreen'
import { VictoryScreen } from './VictoryScreen'
import { useTheme } from '../contexts/ThemeContext'

// Game configuration - Player-centered camera with viewport
const GRID_SIZE = 1 // Size of each grid cell in world units
const VIEWPORT_WIDTH = 7 // Number of grid cells visible horizontally
const VIEWPORT_HEIGHT = 7 // Number of grid cells visible vertically
const CELL_SIZE = 0.9 // Size of the square character relative to grid cell

// World is infinite (or very large), no boundaries
// Camera follows player and shows VIEWPORT_WIDTH x VIEWPORT_HEIGHT around them

// Reusable objects for rendering (created once, reused every frame to avoid allocations)
const reusableBorderColor = new Color(0.2, 0.2, 0.2, 0.8)
const reusableBorderSize = new Vector2(0, 0)
const reusableExitBorderOpen = new Color(0.2, 0.8, 0.2, 1)
const reusableExitBorderClosed = new Color(0.5, 0.1, 0.1, 1)
const reusableExitBorderSize = new Vector2(0, 0)
const reusableGhostColor = new Color(0.7, 0.3, 0.9, 0.5)
const reusablePowerUpInnerColor = new Color(0.9, 0.6, 1, 0.6)
const reusableDecorativeCenterColor = new Color(0.1, 0.3, 0.1, 1)
const reusableFrozenEnemyColor = new Color(0.3, 0.7, 0.9, 1)

// Cache for power-up pulse calculations (updated less frequently)
let powerUpPulseCache = { time: 0, pulse: 1, innerPulse: 1 }
const POWER_UP_PULSE_UPDATE_INTERVAL = 16 // Update every ~16ms (60fps)

/**
 * Pressure Plate class - Activates when a block is placed on it
 */
class PressurePlate extends EngineObject {
  public gridX: number = 0
  public gridY: number = 0
  public isActivated: boolean = false

  constructor(gridX: number, gridY: number) {
    const startPos = new Vector2(0, 0)
    const size = new Vector2(GRID_SIZE * 0.8, GRID_SIZE * 0.8)
    super(startPos, size, undefined, 0, YELLOW)
    
    this.mass = 0
    this.gridX = gridX
    this.gridY = gridY
    this.updateWorldPosition()
  }

  private updateWorldPosition(): void {
    this.pos.x = this.gridX * GRID_SIZE + GRID_SIZE / 2
    this.pos.y = this.gridY * GRID_SIZE + GRID_SIZE / 2
  }

  /**
   * Check if a block or player is on this pressure plate
   */
  checkActivation(): boolean {
    const platePos = new Vector2(this.gridX * GRID_SIZE + GRID_SIZE / 2, this.gridY * GRID_SIZE + GRID_SIZE / 2)
    const objectsOnPlate = engineObjectsCollect(platePos, GRID_SIZE * 0.4, engineObjects)
    const hasBlock = objectsOnPlate.some(obj => obj instanceof Block)
    const hasPlayer = objectsOnPlate.some(obj => obj instanceof Player)
    
    this.isActivated = hasBlock || hasPlayer
    
    // Change color based on activation
    if (this.isActivated) {
      this.color = GREEN
    } else {
      this.color = YELLOW
    }
    
    return this.isActivated
  }

  render(): void {
    // Only render if in viewport
    if (!isInViewport(this.gridX, this.gridY)) {
      return
    }
    
    // Draw pressure plate
    drawRect(this.pos, this.size, this.color)
  }
}

/**
 * Exit Gate class - Win condition when player reaches it
 * Blocks movement until pressure plate is activated
 */
class ExitGate extends EngineObject {
  public gridX: number = 0
  public gridY: number = 0
  public isOpen: boolean = false

  constructor(gridX: number, gridY: number) {
    const startPos = new Vector2(0, 0)
    const size = new Vector2(GRID_SIZE * CELL_SIZE, GRID_SIZE * CELL_SIZE)
    // Start as red (blocked) until pressure plate activates
    super(startPos, size, undefined, 0, RED)
    
    this.mass = 0
    this.gridX = gridX
    this.gridY = gridY
    this.isOpen = false
    this.updateWorldPosition()
  }

  private updateWorldPosition(): void {
    this.pos.x = this.gridX * GRID_SIZE + GRID_SIZE / 2
    this.pos.y = this.gridY * GRID_SIZE + GRID_SIZE / 2
  }

  /**
   * Update exit gate state based on pressure plate activation
   */
  update(): void {
    if (pressurePlate && pressurePlate.isActivated) {
      if (!this.isOpen) {
        this.isOpen = true
        this.color = GREEN // Change to green when open
      }
    } else {
      if (this.isOpen) {
        this.isOpen = false
        this.color = RED // Change back to red when closed
      }
    }
  }

  /**
   * Check if a position would collide with this exit gate (when closed)
   */
  wouldCollide(gridX: number, gridY: number): boolean {
    if (this.isOpen) return false // Open exit doesn't block
    return this.gridX === gridX && this.gridY === gridY
  }

  /**
   * Check if player is on the exit and exit is open
   */
  checkPlayerReached(): boolean {
    if (!player) return false
    if (this.gridX !== player.gridX || this.gridY !== player.gridY) return false
    
    // Exit only works if it's open (pressure plate activated)
    return this.isOpen
  }

  render(): void {
    // Only render if in viewport (exit view shows arrows, not the object itself)
    if (!isInViewport(this.gridX, this.gridY)) {
      return
    }
    
    // Draw exit gate
    drawRect(this.pos, this.size, this.color)
    // Add border (reuse objects)
    reusableExitBorderSize.x = this.size.x * 0.85
    reusableExitBorderSize.y = this.size.y * 0.85
    const borderColor = this.isOpen ? reusableExitBorderOpen : reusableExitBorderClosed
    drawRect(this.pos, reusableExitBorderSize, borderColor)
  }
}

/**
 * Door class - Blocks access to a new area until opened (DEPRECATED - keeping for compatibility)
 */
class Door extends EngineObject {
  public gridX: number = 0
  public gridY: number = 0
  public isOpen: boolean = false

  constructor(gridX: number, gridY: number) {
    const startPos = new Vector2(0, 0)
    const size = new Vector2(GRID_SIZE * CELL_SIZE, GRID_SIZE * CELL_SIZE)
    super(startPos, size, undefined, 0, new Color(0.5, 0.5, 0.5, 1))
    
    this.mass = 0
    this.gridX = gridX
    this.gridY = gridY
    this.updateWorldPosition()
  }

  private updateWorldPosition(): void {
    this.pos.x = this.gridX * GRID_SIZE + GRID_SIZE / 2
    this.pos.y = this.gridY * GRID_SIZE + GRID_SIZE / 2
  }

  open(): void {
    this.isOpen = true
    this.color = new Color(0.3, 0.3, 0.3, 0.3) // Semi-transparent when open
  }

  close(): void {
    this.isOpen = false
    this.color = new Color(0.5, 0.5, 0.5, 1) // Solid when closed
  }

  /**
   * Check if a position would collide with this door
   */
  wouldCollide(gridX: number, gridY: number): boolean {
    if (this.isOpen) return false
    return this.gridX === gridX && this.gridY === gridY
  }

  render(): void {
    // Only render if in viewport
    if (!isInViewport(this.gridX, this.gridY)) {
      return
    }
    
    if (!this.isOpen) {
      drawRect(this.pos, this.size, this.color)
    }
  }
}

/**
 * Wall class - Blocks movement, cannot be moved or interacted with
 */
class Wall extends EngineObject {
  public gridX: number = 0
  public gridY: number = 0

  constructor(gridX: number, gridY: number) {
    const startPos = new Vector2(0, 0)
    const size = new Vector2(GRID_SIZE * CELL_SIZE, GRID_SIZE * CELL_SIZE)
    super(startPos, size, undefined, 0, GRAY)
    
    this.mass = 0
    this.gridX = gridX
    this.gridY = gridY
    this.updateWorldPosition()
  }

  private updateWorldPosition(): void {
    this.pos.x = this.gridX * GRID_SIZE + GRID_SIZE / 2
    this.pos.y = this.gridY * GRID_SIZE + GRID_SIZE / 2
  }

  render(): void {
    // Only render if in viewport
    if (!isInViewport(this.gridX, this.gridY)) {
      return
    }
    
    // Adjust wall color based on theme for better visibility
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light'
    const wallColor = currentTheme === 'dark' 
      ? new Color(0.6, 0.6, 0.6, 1) // Lighter gray for dark mode
      : this.color // Use GRAY for light mode
    
    // Draw wall with a darker border for depth
    drawRect(this.pos, this.size, wallColor)
    // Add a subtle darker outline by drawing a slightly smaller rect (reuse objects)
    reusableBorderSize.x = this.size.x * 0.9
    reusableBorderSize.y = this.size.y * 0.9
    const borderColor = currentTheme === 'dark'
      ? new Color(0.4, 0.4, 0.4, 0.8) // Lighter border for dark mode
      : reusableBorderColor
    drawRect(this.pos, reusableBorderSize, borderColor)
  }
}

/**
 * DecorativeObject class - Non-interactable decorative elements
 */
class DecorativeObject extends EngineObject {
  public gridX: number = 0
  public gridY: number = 0
  private objectType: 'rock' | 'bush' = 'rock'

  constructor(gridX: number, gridY: number, type: 'rock' | 'bush' = 'rock') {
    const startPos = new Vector2(0, 0)
    const size = new Vector2(GRID_SIZE * 0.6, GRID_SIZE * 0.6)
    
    // Different colors for different types
    let color = new Color(0.4, 0.4, 0.4, 1) // Default gray for rock
    if (type === 'bush') {
      color = new Color(0.2, 0.5, 0.2, 1) // Green for bush
    }
    
    super(startPos, size, undefined, 0, color)
    
    this.mass = 0
    this.gridX = gridX
    this.gridY = gridY
    this.objectType = type
    this.updateWorldPosition()
  }

  private updateWorldPosition(): void {
    this.pos.x = this.gridX * GRID_SIZE + GRID_SIZE / 2
    this.pos.y = this.gridY * GRID_SIZE + GRID_SIZE / 2
  }

  render(): void {
    // Only render if in viewport
    if (!isInViewport(this.gridX, this.gridY)) {
      return
    }
    
    if (this.objectType === 'rock') {
      // Draw rock as a circle
      drawCircle(this.pos, this.size.x * 0.5, this.color)
    } else if (this.objectType === 'bush') {
      // Draw bush as a circle with darker center (reuse color object)
      drawCircle(this.pos, this.size.x * 0.5, this.color)
      drawCircle(this.pos, this.size.x * 0.3, reusableDecorativeCenterColor)
    }
  }
}

/**
 * PowerUp class - Collectible items that give special abilities
 */
class PowerUp extends EngineObject {
  public gridX: number = 0
  public gridY: number = 0
  public powerType: 'ghost' | 'freeze' | 'exitView' | 'enemyView' = 'ghost'
  public isCollected: boolean = false

  constructor(gridX: number, gridY: number, type: 'ghost' | 'freeze' | 'exitView' | 'enemyView' = 'ghost') {
    const startPos = new Vector2(0, 0)
    const size = new Vector2(GRID_SIZE * 0.7, GRID_SIZE * 0.7)
    
    // Different colors for different power-up types
    let color: Color
    if (type === 'ghost') {
      color = new Color(0.7, 0.3, 0.9, 1) // Purple for ghost
    } else if (type === 'freeze') {
      color = new Color(0.3, 0.7, 0.9, 1) // Blue for freeze
    } else if (type === 'exitView') {
      color = new Color(0.9, 0.9, 0.3, 1) // Yellow for exit view
    } else if (type === 'enemyView') {
      color = new Color(0.9, 0.5, 0.3, 1) // Orange for enemy view
    } else {
      color = new Color(0.7, 0.3, 0.9, 1) // Default purple
    }
    
    super(startPos, size, undefined, 0, color)
    
    this.mass = 0
    this.gridX = gridX
    this.gridY = gridY
    this.powerType = type
    this.updateWorldPosition()
  }

  private updateWorldPosition(): void {
    this.pos.x = this.gridX * GRID_SIZE + GRID_SIZE / 2
    this.pos.y = this.gridY * GRID_SIZE + GRID_SIZE / 2
  }

  /**
   * Check if player collected this power-up
   */
  checkCollection(): boolean {
    // Early return if already collected or no player
    if (this.isCollected || !player) return false
    
    // Only allow collection if player is on the same grid position
    if (this.gridX === player.gridX && this.gridY === player.gridY) {
      // CRITICAL: Set isCollected FIRST to prevent duplicate collection
      this.isCollected = true
      
      // Double-check that power-up is not on a wall (should never happen, but safety check)
      const isOnWall = walls.some(w => w.gridX === this.gridX && w.gridY === this.gridY)
      if (isOnWall) {
        console.warn(`Power-up at (${this.gridX}, ${this.gridY}) is on a wall! Removing it without activation.`)
        return false // Don't activate, just remove the invalid power-up
      }
      
      return true
    }
    
    return false
  }

  render(): void {
    if (this.isCollected) return // Don't render collected power-ups
    
    // Only render if in viewport
    if (!isInViewport(this.gridX, this.gridY)) {
      return
    }
    
    if (this.powerType === 'ghost') {
      // Draw ghost power-up as a glowing circle with pulsing effect (use cached pulse)
      drawCircle(this.pos, this.size.x * 0.5 * powerUpPulseCache.pulse, this.color)
      // Inner glow (reuse color object)
      drawCircle(this.pos, this.size.x * 0.3 * powerUpPulseCache.innerPulse, reusablePowerUpInnerColor)
    } else if (this.powerType === 'freeze') {
      // Draw freeze power-up as a glowing circle with pulsing effect (blue) - use cached pulse
      drawCircle(this.pos, this.size.x * 0.5 * powerUpPulseCache.pulse, this.color)
      // Inner glow (lighter blue) - reuse color object
      reusablePowerUpInnerColor.r = 0.6
      reusablePowerUpInnerColor.g = 0.9
      reusablePowerUpInnerColor.b = 1
      drawCircle(this.pos, this.size.x * 0.3 * powerUpPulseCache.innerPulse, reusablePowerUpInnerColor)
    } else if (this.powerType === 'exitView') {
      // Draw exit view power-up as a glowing circle with pulsing effect (yellow) - use cached pulse
      drawCircle(this.pos, this.size.x * 0.5 * powerUpPulseCache.pulse, this.color)
      // Inner glow (lighter yellow) - reuse color object
      reusablePowerUpInnerColor.r = 1
      reusablePowerUpInnerColor.g = 1
      reusablePowerUpInnerColor.b = 0.6
      drawCircle(this.pos, this.size.x * 0.3 * powerUpPulseCache.innerPulse, reusablePowerUpInnerColor)
    } else if (this.powerType === 'enemyView') {
      // Draw enemy view power-up as a glowing circle with pulsing effect (orange) - use cached pulse
      drawCircle(this.pos, this.size.x * 0.5 * powerUpPulseCache.pulse, this.color)
      // Inner glow (lighter orange) - reuse color object
      reusablePowerUpInnerColor.r = 1
      reusablePowerUpInnerColor.g = 0.8
      reusablePowerUpInnerColor.b = 0.6
      drawCircle(this.pos, this.size.x * 0.3 * powerUpPulseCache.innerPulse, reusablePowerUpInnerColor)
    }
  }
}

/**
 * Block class - A pushable block
 */
class Block extends EngineObject {
  public gridX: number = 0
  public gridY: number = 0
  public isMoving: boolean = false // Made public to check from Player
  private moveSpeed: number = 5 // Grid cells per second (matches player for consistency)
  private targetGridX: number = 0
  private targetGridY: number = 0

  constructor(gridX: number, gridY: number) {
    const startPos = new Vector2(0, 0)
    const size = new Vector2(GRID_SIZE * CELL_SIZE, GRID_SIZE * CELL_SIZE)
    super(startPos, size, undefined, 0, BLUE)
    
    this.mass = 0
    this.gridX = gridX
    this.gridY = gridY
    this.targetGridX = gridX
    this.targetGridY = gridY
    this.updateWorldPosition()
  }

  /**
   * Update world position based on current grid position
   */
  private updateWorldPosition(): void {
    this.pos.x = this.gridX * GRID_SIZE + GRID_SIZE / 2
    this.pos.y = this.gridY * GRID_SIZE + GRID_SIZE / 2
  }

  /**
   * Move to target grid position smoothly with easing
   */
  private moveToTarget(): void {
    const targetWorldX = this.targetGridX * GRID_SIZE + GRID_SIZE / 2
    const targetWorldY = this.targetGridY * GRID_SIZE + GRID_SIZE / 2
    
    const dx = targetWorldX - this.pos.x
    const dy = targetWorldY - this.pos.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    if (distance < 0.005) {
      // Reached target
      this.gridX = this.targetGridX
      this.gridY = this.targetGridY
      this.pos.x = targetWorldX
      this.pos.y = targetWorldY
      this.isMoving = false
    } else {
      // Smooth movement with easing
      const moveDistance = this.moveSpeed * GRID_SIZE * timeDelta
      const moveRatio = Math.min(1, moveDistance / distance)
      
      // Apply easing for smoother acceleration/deceleration
      const easedRatio = moveRatio * (2 - moveRatio) // Ease-out curve
      
      this.pos.x += dx * easedRatio
      this.pos.y += dy * easedRatio
    }
  }

  /**
   * Push the block in a direction
   */
  push(newGridX: number, newGridY: number): boolean {
    // CRITICAL: Return false immediately if already moving to prevent duplicate pushes
    if (this.isMoving) {
      return false
    }
    
    // No world boundaries - blocks can be pushed anywhere

    // Check if there's a wall or closed door at the target position
    const targetPos = new Vector2(newGridX * GRID_SIZE + GRID_SIZE / 2, newGridY * GRID_SIZE + GRID_SIZE / 2)
    const objectsAtTarget = engineObjectsCollect(targetPos, GRID_SIZE * 0.5, engineObjects)
    const hasWall = objectsAtTarget.some(obj => obj instanceof Wall)
    const hasClosedDoor = objectsAtTarget.some(obj => obj instanceof Door && !obj.isOpen)
    
    if (hasWall) {
      return false // Can't push into a wall
    }
    
    if (hasClosedDoor) {
      return false // Can't push into a closed door
    }
    
    // Check if there's another block at the target position
    const hasBlock = objectsAtTarget.some(obj => obj instanceof Block && obj !== this)
    if (hasBlock) {
      return false // Can't push into another block
    }

    // Check if there's another block at the target position
    const hasOtherBlock = objectsAtTarget.some(obj => obj instanceof Block && obj !== this)
    
    if (hasOtherBlock) {
      return false // Can't push into another block
    }

    this.targetGridX = newGridX
    this.targetGridY = newGridY
    this.isMoving = true
    return true
  }

  /**
   * Set position directly
   */
  setPosition(gridX: number, gridY: number): void {
    this.gridX = gridX
    this.gridY = gridY
    this.targetGridX = gridX
    this.targetGridY = gridY
    this.isMoving = false
    this.updateWorldPosition()
  }

  update(): void {
    if (this.isMoving) {
      this.moveToTarget()
    }
  }

  render(): void {
    // Only render if in viewport (exit view shows arrows, not the object itself)
    if (!isInViewport(this.gridX, this.gridY)) {
      return
    }
    
    drawRect(this.pos, this.size, this.color)
  }
}

/**
 * Enemy class - Follows the player and causes game over on contact
 */
class Enemy extends EngineObject {
  public gridX: number = 0
  public gridY: number = 0
  private targetGridX: number = 0
  private targetGridY: number = 0
  public isMoving: boolean = false // Made public for movement check
  private moveSpeed: number = 5 // Same as player for consistency
  private originalColor: Color = ORANGE // Store original color
  public enemyType: 'orange' | 'purple' = 'orange' // Enemy type
  private patrolCenterX: number = 0 // Center of patrol area for purple enemies
  private patrolCenterY: number = 0 // Center of patrol area for purple enemies
  private patrolRadius: number = 4 // 8x8 area = 4 cells radius
  public isChasing: boolean = false // Purple enemy is chasing player

  constructor(gridX: number, gridY: number, type: 'orange' | 'purple' = 'orange') {
    const startPos = new Vector2(0, 0)
    const size = new Vector2(GRID_SIZE * CELL_SIZE, GRID_SIZE * CELL_SIZE)
    const color = type === 'orange' ? ORANGE : new Color(0.7, 0.3, 0.9, 1) // Purple color - more visible
    super(startPos, size, undefined, 0, color)
    
    this.mass = 0
    this.gridX = gridX
    this.gridY = gridY
    this.targetGridX = gridX
    this.targetGridY = gridY
    this.enemyType = type
    this.originalColor = color
    
    // Set patrol center for purple enemies
    if (type === 'purple') {
      this.patrolCenterX = gridX
      this.patrolCenterY = gridY
    }
    
    this.updateWorldPosition()
  }

  private updateWorldPosition(): void {
    this.pos.x = this.gridX * GRID_SIZE + GRID_SIZE / 2
    this.pos.y = this.gridY * GRID_SIZE + GRID_SIZE / 2
  }

  /**
   * Move to target grid position smoothly
   */
  private moveToTarget(): void {
    const targetWorldX = this.targetGridX * GRID_SIZE + GRID_SIZE / 2
    const targetWorldY = this.targetGridY * GRID_SIZE + GRID_SIZE / 2
    
    const dx = targetWorldX - this.pos.x
    const dy = targetWorldY - this.pos.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    if (distance < 0.005) {
      this.gridX = this.targetGridX
      this.gridY = this.targetGridY
      this.pos.x = targetWorldX
      this.pos.y = targetWorldY
      this.isMoving = false
    } else {
      const moveDistance = this.moveSpeed * GRID_SIZE * timeDelta
      const moveRatio = Math.min(1, moveDistance / distance)
      const easedRatio = moveRatio * (2 - moveRatio) // Ease-out
      this.pos.x += dx * easedRatio
      this.pos.y += dy * easedRatio
    }
  }

  /**
   * Check if a position is blocked (wall, block, closed exit, or other enemy)
   * Open exit gate does not block enemies
   */
  private isBlocked(gridX: number, gridY: number): boolean {
    const targetPos = new Vector2(gridX * GRID_SIZE + GRID_SIZE / 2, gridY * GRID_SIZE + GRID_SIZE / 2)
    const objectsAtTarget = engineObjectsCollect(targetPos, GRID_SIZE * 0.5, engineObjects)
    
    // Check for closed exit gate
    if (exitGate && exitGate.wouldCollide(gridX, gridY)) {
      return true
    }
    
    // Check for walls and blocks
    if (objectsAtTarget.some(obj => obj instanceof Wall || obj instanceof Block)) {
      return true
    }
    
    // Check for other enemies (collision detection - enemies can't overlap)
    const enemyAtTarget = objectsAtTarget.find(obj => obj instanceof Enemy && obj !== this)
    if (enemyAtTarget) {
      return true // Blocked by another enemy
    }
    
    return false
  }

  /**
   * Check if a position is within patrol area (for purple enemies)
   */
  private isInPatrolArea(gridX: number, gridY: number): boolean {
    if (this.enemyType !== 'purple') return true // Orange enemies can move anywhere
    
    const dx = gridX - this.patrolCenterX
    const dy = gridY - this.patrolCenterY
    
    // Check if within 8x8 area (4 cells radius)
    return Math.abs(dx) <= this.patrolRadius && Math.abs(dy) <= this.patrolRadius
  }

  /**
   * Check if player is within 4x4 FOV (2 cells radius)
   */
  private isPlayerInFOV(): boolean {
    if (!player || this.enemyType !== 'purple') return false
    
    const dx = Math.abs(player.gridX - this.gridX)
    const dy = Math.abs(player.gridY - this.gridY)
    
    // 4x4 area = 2 cells in each direction
    return dx <= 2 && dy <= 2
  }

  /**
   * Check if player is within 8x8 patrol area
   */
  private isPlayerInPatrolArea(): boolean {
    if (!player || this.enemyType !== 'purple') return false
    
    const dx = player.gridX - this.patrolCenterX
    const dy = player.gridY - this.patrolCenterY
    
    return Math.abs(dx) <= this.patrolRadius && Math.abs(dy) <= this.patrolRadius
  }

  /**
   * Chase behavior for purple enemies (when player is in FOV)
   */
  private chasePlayer(): boolean {
    if (this.isMoving || !player || enemiesFrozen) return false
    
    const dx = player.gridX - this.gridX
    const dy = player.gridY - this.gridY
    
    // Try to move towards player
    let newGridX = this.gridX
    let newGridY = this.gridY
    
    // Prioritize the axis with the larger difference
    if (Math.abs(dx) > Math.abs(dy)) {
      newGridX = this.gridX + (dx > 0 ? 1 : -1)
    } else {
      newGridY = this.gridY + (dy > 0 ? 1 : -1)
    }
    
    // Check if blocked
    if (this.isBlocked(newGridX, newGridY)) {
      // Try the other axis
      if (newGridX !== this.gridX) {
        newGridY = this.gridY + (dy > 0 ? 1 : -1)
        newGridX = this.gridX
      } else {
        newGridX = this.gridX + (dx > 0 ? 1 : -1)
        newGridY = this.gridY
      }
      
      // If still blocked, can't move
      if (this.isBlocked(newGridX, newGridY)) {
        return false
      }
    }
    
    // Move towards player (can leave patrol area while chasing)
    this.targetGridX = newGridX
    this.targetGridY = newGridY
    this.isMoving = true
    return true
  }

  /**
   * Patrol behavior for purple enemies (roam in 8x8 area)
   */
  private patrol(): boolean {
    if (this.isMoving || enemiesFrozen) return false
    
    // Try to move in a random direction within patrol area
    const directions = [
      { x: 0, y: 1 },   // Up
      { x: 0, y: -1 },  // Down
      { x: 1, y: 0 },   // Right
      { x: -1, y: 0 }   // Left
    ]
    
    // Shuffle directions for more random movement
    const shuffled = directions.sort(() => Math.random() - 0.5)
    
    for (const dir of shuffled) {
      const newGridX = this.gridX + dir.x
      const newGridY = this.gridY + dir.y
      
      // Check if within patrol area
      if (!this.isInPatrolArea(newGridX, newGridY)) {
        continue // Skip if outside patrol area
      }
      
      // Check if blocked
      if (!this.isBlocked(newGridX, newGridY)) {
        this.targetGridX = newGridX
        this.targetGridY = newGridY
        this.isMoving = true
        return true
      }
    }
    
    return false // Couldn't move
  }

  /**
   * Push the enemy (when frozen, can be pushed like a block)
   */
  push(newGridX: number, newGridY: number): boolean {
    if (this.isMoving || !enemiesFrozen) return false // Can only push when frozen
    
    // Check if there's a wall, block, or other enemy at the target position
    const targetPos = new Vector2(newGridX * GRID_SIZE + GRID_SIZE / 2, newGridY * GRID_SIZE + GRID_SIZE / 2)
    const objectsAtTarget = engineObjectsCollect(targetPos, GRID_SIZE * 0.5, engineObjects)
    
    const hasWall = objectsAtTarget.some(obj => obj instanceof Wall)
    const hasBlock = objectsAtTarget.some(obj => obj instanceof Block)
    const hasOtherEnemy = objectsAtTarget.some(obj => obj instanceof Enemy && obj !== this)
    
    if (hasWall || hasBlock || hasOtherEnemy) {
      return false // Can't push into wall, block, or another enemy
    }
    
    // Check if there's a closed exit gate
    if (exitGate && exitGate.wouldCollide(newGridX, newGridY)) {
      return false
    }
    
    // Can push
    this.targetGridX = newGridX
    this.targetGridY = newGridY
    this.isMoving = true
    return true
  }

  /**
   * Simple pathfinding: move towards player (one step)
   * Returns true if moved, false if couldn't move
   */
  moveTowardsPlayer(): boolean {
    if (this.isMoving || enemiesFrozen) return false // Don't move if frozen
    
    // Purple enemies: check if player is in FOV or already chasing
    if (this.enemyType === 'purple') {
      const playerInFOV = this.isPlayerInFOV()
      const playerInPatrolArea = this.isPlayerInPatrolArea()
      
      // Start chasing if player enters FOV
      if (playerInFOV && !this.isChasing) {
        this.isChasing = true
      }
      
      // Stop chasing if player leaves patrol area
      if (this.isChasing && !playerInPatrolArea) {
        this.isChasing = false
      }
      
      // If chasing, follow player (can leave patrol area)
      if (this.isChasing) {
        return this.chasePlayer()
      }
      
      // Otherwise, patrol
      return this.patrol()
    }
    
    // Orange enemies follow player
    if (!player) return false
    
    const dx = player.gridX - this.gridX
    const dy = player.gridY - this.gridY
    
    // Try to move in the direction of the player
    // Prioritize the axis with larger difference
    let newGridX = this.gridX
    let newGridY = this.gridY
    
    if (Math.abs(dx) > Math.abs(dy)) {
      // Move horizontally first
      newGridX = this.gridX + (dx > 0 ? 1 : -1)
      if (this.isBlocked(newGridX, newGridY)) {
        // Try vertical instead
        newGridY = this.gridY + (dy > 0 ? 1 : -1)
        newGridX = this.gridX
      }
    } else {
      // Move vertically first
      newGridY = this.gridY + (dy > 0 ? 1 : -1)
      if (this.isBlocked(newGridX, newGridY)) {
        // Try horizontal instead
        newGridX = this.gridX + (dx > 0 ? 1 : -1)
        newGridY = this.gridY
      }
    }
    
    // Check if the chosen direction is blocked
    if (this.isBlocked(newGridX, newGridY)) {
      // Try the other axis
      if (newGridX !== this.gridX) {
        newGridY = this.gridY + (dy > 0 ? 1 : -1)
        newGridX = this.gridX
      } else {
        newGridX = this.gridX + (dx > 0 ? 1 : -1)
        newGridY = this.gridY
      }
      
      // If still blocked, can't move
      if (this.isBlocked(newGridX, newGridY)) {
        return false
      }
    }
    
    // Move to the new position
    this.targetGridX = newGridX
    this.targetGridY = newGridY
    this.isMoving = true
    return true
  }

  /**
   * Check if enemy is touching the player
   */
  checkCollisionWithPlayer(): boolean {
    if (!player) return false
    return this.gridX === player.gridX && this.gridY === player.gridY
  }

  update(): void {
    const wasMoving = this.isMoving
    if (this.isMoving) {
      this.moveToTarget()
    }
    
    // Check collision when enemy finishes moving (important for purple enemies that might catch player)
    if (wasMoving && !this.isMoving && !player?.isGhostMode && !enemiesFrozen) {
      if (this.checkCollisionWithPlayer()) {
        triggerGameOver()
        return
      }
    }
    
    // Update color based on freeze state (reuse color object instead of creating new)
    if (enemiesFrozen) {
      this.color = reusableFrozenEnemyColor // Blue when frozen
    } else {
      this.color = this.originalColor // Original color (orange or purple)
    }
  }

  render(): void {
    // Only render if in viewport (enemy view shows indicators, not the object itself)
    if (!isInViewport(this.gridX, this.gridY)) {
      return
    }
    
    drawRect(this.pos, this.size, this.color)
  }
}

/**
 * Player class - A square character that moves on a grid and can push blocks
 */
class Player extends EngineObject {
  public gridX: number = 0
  public gridY: number = 0
  public isMoving: boolean = false // Made public for enemy movement check
  public isGhostMode: boolean = false // Can move through walls and enemies
  private moveSpeed: number = 5 // Grid cells per second (slower for smoother feel)
  public targetGridX: number = 0 // Made public for viewport updates during movement
  public targetGridY: number = 0 // Made public for viewport updates during movement

  constructor() {
    // Create player at grid position (0, 0)
    const startPos = new Vector2(0, 0)
    const size = new Vector2(GRID_SIZE * CELL_SIZE, GRID_SIZE * CELL_SIZE)
    super(startPos, size, undefined, 0, RED)
    
    // Set mass to 0 to make it static (no physics)
    this.mass = 0
    this.gridX = 0
    this.gridY = 0
    this.targetGridX = 0
    this.targetGridY = 0
    this.updateWorldPosition()
  }

  /**
   * Update world position based on current grid position
   * Centers the player in the grid cell
   */
  private updateWorldPosition(): void {
    // Center the player in the grid cell
    // pos is the center of the object, so we offset by half a grid cell
    this.pos.x = this.gridX * GRID_SIZE + GRID_SIZE / 2
    this.pos.y = this.gridY * GRID_SIZE + GRID_SIZE / 2
  }

  /**
   * Move to target grid position smoothly with easing
   */
  private moveToTarget(): void {
    // Target position is the center of the target grid cell
    const targetWorldX = this.targetGridX * GRID_SIZE + GRID_SIZE / 2
    const targetWorldY = this.targetGridY * GRID_SIZE + GRID_SIZE / 2
    
    const dx = targetWorldX - this.pos.x
    const dy = targetWorldY - this.pos.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    if (distance < 0.005) {
      // Reached target (smaller threshold for smoother snap)
      this.gridX = this.targetGridX
      this.gridY = this.targetGridY
      this.pos.x = targetWorldX
      this.pos.y = targetWorldY
      this.isMoving = false
      // Ensure position is exactly on grid after movement completes
      this.updateWorldPosition()
    } else {
      // Smooth movement with easing (ease-out for natural feel)
      const moveDistance = this.moveSpeed * GRID_SIZE * timeDelta
      const moveRatio = Math.min(1, moveDistance / distance)
      
      // Apply easing for smoother acceleration/deceleration
      const easedRatio = moveRatio * (2 - moveRatio) // Ease-out curve
      
      this.pos.x += dx * easedRatio
      this.pos.y += dy * easedRatio
    }
  }



  /**
   * Check if there's a block at the given grid position
   */
  private getBlockAt(gridX: number, gridY: number): Block | null {
    const targetPos = new Vector2(gridX * GRID_SIZE + GRID_SIZE / 2, gridY * GRID_SIZE + GRID_SIZE / 2)
    const objectsAtTarget = engineObjectsCollect(targetPos, GRID_SIZE * 0.5, engineObjects)
    const block = objectsAtTarget.find(obj => obj instanceof Block) as Block | undefined
    return block || null
  }

  /**
   * Check if there's a wall at the given grid position
   */
  private getWallAt(gridX: number, gridY: number): Wall | null {
    const targetPos = new Vector2(gridX * GRID_SIZE + GRID_SIZE / 2, gridY * GRID_SIZE + GRID_SIZE / 2)
    const objectsAtTarget = engineObjectsCollect(targetPos, GRID_SIZE * 0.5, engineObjects)
    const wall = objectsAtTarget.find(obj => obj instanceof Wall) as Wall | undefined
    return wall || null
  }

  /**
   * Check if there's a frozen enemy at the given grid position
   */
  private getEnemyAt(gridX: number, gridY: number): Enemy | null {
    if (!enemiesFrozen) return null // Can only push when frozen
    
    const targetPos = new Vector2(gridX * GRID_SIZE + GRID_SIZE / 2, gridY * GRID_SIZE + GRID_SIZE / 2)
    const objectsAtTarget = engineObjectsCollect(targetPos, GRID_SIZE * 0.5, engineObjects)
    const enemy = objectsAtTarget.find(obj => obj instanceof Enemy) as Enemy | undefined
    return enemy || null
  }

  /**
   * Override update method to handle input and movement with block pushing
   */
  update(): void {
    // Only accept new input if not currently moving
    if (!this.isMoving) {
      let moved = false
      let newGridX = this.gridX
      let newGridY = this.gridY
      
      // Separate mobile and desktop controls - they work independently
      const isMobile = isMobileDevice()
      
      // Mobile: Only use swipe direction
      // Desktop: Only use keyboard input
      if (isMobile) {
        // Mobile controls - capture and reset swipe direction
        const currentSwipe = swipeDirection
        swipeDirection = null // Always reset immediately, even if null
        
        // Only process swipe on mobile
        if (currentSwipe === 'up') {
          newGridY = this.gridY + 1
          moved = true
        } else if (currentSwipe === 'down') {
          newGridY = this.gridY - 1
          moved = true
        } else if (currentSwipe === 'left') {
          newGridX = this.gridX - 1
          moved = true
        } else if (currentSwipe === 'right') {
          newGridX = this.gridX + 1
          moved = true
        }
      } else {
        // Desktop controls - only use keyboard input
        if (keyWasPressed('ArrowUp') || keyWasPressed('w') || keyWasPressed('W')) {
          newGridY = this.gridY + 1
          moved = true
        } else if (keyWasPressed('ArrowDown') || keyWasPressed('s') || keyWasPressed('S')) {
          newGridY = this.gridY - 1
          moved = true
        } else if (keyWasPressed('ArrowLeft') || keyWasPressed('a') || keyWasPressed('A')) {
          newGridX = this.gridX - 1
          moved = true
        } else if (keyWasPressed('ArrowRight') || keyWasPressed('d') || keyWasPressed('D')) {
          newGridX = this.gridX + 1
          moved = true
        }
      }

      if (moved) {
        // Check if there's a wall blocking the way
        const wall = this.getWallAt(newGridX, newGridY)
        
        if (wall) {
          // Check if this is a border wall (always blocks, even in ghost mode)
          const worldSize = 50
          const isBorderWall = wall.gridX === -worldSize || wall.gridX === worldSize ||
                               wall.gridY === -worldSize || wall.gridY === worldSize
          
          if (isBorderWall) {
            // Border walls always block movement
            return
          }
          
          // If not in ghost mode or no wall passes remaining, block movement
          if (!this.isGhostMode || ghostWallPasses <= 0) {
            return
          }
          
          // Player is passing through a wall - decrement counter
          ghostWallPasses--
          console.log(`Ghost wall pass! ${ghostWallPasses} wall passes remaining.`)
          
          if (ghostWallPasses <= 0) {
            // No more wall passes, end ghost mode
            this.isGhostMode = false
            console.log('Ghost mode ended - no wall passes remaining!')
          }
        }

        // Check if there's a closed exit gate blocking the way (always blocks, even in ghost mode)
        if (exitGate && exitGate.wouldCollide(newGridX, newGridY)) {
          // Exit is closed, can't move through
          return
        }

        // Check if moving outside map boundaries (always blocks, even in ghost mode)
        const worldSize = 50
        if (newGridX < -worldSize || newGridX > worldSize || newGridY < -worldSize || newGridY > worldSize) {
          return // Can't move outside map boundaries
        }

        // Check if there's a block or frozen enemy at the target position
        const block = this.getBlockAt(newGridX, newGridY)
        const frozenEnemy = enemiesFrozen ? this.getEnemyAt(newGridX, newGridY) : null
        
        if (block) {
          // CRITICAL: Check if block is already moving - prevent duplicate pushes
          if (block.isMoving) {
            return // Block is already moving, don't allow player movement
          }
          
          // Try to push the block
          const pushX = newGridX + (newGridX - this.gridX)
          const pushY = newGridY + (newGridY - this.gridY)
          
          // Double-check block is not moving before push attempt (race condition protection)
          if (!block.isMoving) {
            if (block.push(pushX, pushY)) {
              // Block can be pushed, so player can move
              this.targetGridX = newGridX
              this.targetGridY = newGridY
              this.isMoving = true
            } else {
              // Block can't be pushed, cancel movement
              return
            }
          } else {
            // Block started moving between check and push attempt, cancel
            return
          }
        } else if (frozenEnemy) {
          // Try to push the frozen enemy
          const pushX = newGridX + (newGridX - this.gridX)
          const pushY = newGridY + (newGridY - this.gridY)
          
          if (frozenEnemy.push(pushX, pushY)) {
            // Frozen enemy can be pushed, so player can move
            this.targetGridX = newGridX
            this.targetGridY = newGridY
            this.isMoving = true
          }
        } else {
          // No block or frozen enemy, player can move freely
          this.targetGridX = newGridX
          this.targetGridY = newGridY
          this.isMoving = true
        }
        
        // Mark that player just moved (for enemy turn-based movement)
        playerJustMoved = true
        
        // Don't snap position - smooth movement will handle it
        // Position will be updated smoothly in moveToTarget()
      }
    }

    // Move towards target if moving
    if (this.isMoving) {
      this.moveToTarget()
    }
  }

  /**
   * Set position directly
   */
  setPosition(gridX: number, gridY: number): void {
    this.gridX = gridX
    this.gridY = gridY
    this.targetGridX = gridX
    this.targetGridY = gridY
    this.isMoving = false
    this.updateWorldPosition()
  }

  /**
   * Override render method to draw the square character
   */
  render(): void {
    drawRect(this.pos, this.size, this.color)
    
    // If in ghost mode, add a visual effect (semi-transparent overlay)
    if (this.isGhostMode) {
      // Use cached pulse calculation (updated in gameUpdate)
      drawRect(this.pos, this.size, reusableGhostColor)
    }
  }
}

// Game state
let player: Player | null = null
let blocks: Block[] = []
let pressurePlate: PressurePlate | null = null
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let doors: Door[] = []
let walls: Wall[] = []
let decorativeObjects: DecorativeObject[] = []
let powerUps: PowerUp[] = []
let enemies: Enemy[] = []
let exitGate: ExitGate | null = null
let gameOver: boolean = false
let gameWon: boolean = false

// Mobile swipe controls
// Mobile swipe controls (only used on mobile devices)
let swipeDirection: 'up' | 'down' | 'left' | 'right' | null = null
let touchStartX: number = 0
let touchStartY: number = 0
const SWIPE_THRESHOLD = 30 // Minimum distance in pixels to register a swipe

// Detect if we're on a mobile device
function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         (typeof window !== 'undefined' && 'ontouchstart' in window)
}

// Callbacks to update React state from LittleJS callbacks
let setGameOverCallback: ((value: boolean) => void) | null = null
let setGameWonCallback: ((value: boolean) => void) | null = null
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let setShowMenuCallback: ((value: boolean) => void) | null = null // Used in useEffect cleanup
let playerJustMoved: boolean = false // Track when player moves to trigger enemy movement
let ghostWallPasses: number = 0 // Number of wall passes remaining (3 total)
let enemiesFrozen: boolean = false // Enemies are frozen
let freezeStepsRemaining: number = 0 // Number of player moves remaining for freeze effect
let exitViewActive: boolean = false // Exit view power-up active
let exitViewStepsRemaining: number = 0 // Number of player moves remaining for exit view
let enemyViewActive: boolean = false // Enemy view power-up active
let enemyViewStepsRemaining: number = 0 // Number of player moves remaining for enemy view
let powerUpActivatedThisFrame: boolean = false // Prevent multiple power-up activations in same frame


/**
 * Randomly generate the world
 */
function generateRandomWorld(): void {
  walls = []
  decorativeObjects = [] // Not used anymore, but keeping for compatibility
  
  // Use Math.random() for truly random generation each time
  function random(): number {
    return Math.random()
  }
  
  // Generate walls in a grid pattern with randomness
  const worldSize = 50 // Generate world from -worldSize to +worldSize
  const wallDensity = 0.15 // 15% of cells will be walls
  
  for (let x = -worldSize; x <= worldSize; x++) {
    for (let y = -worldSize; y <= worldSize; y++) {
      // Skip area around spawn (0,0) to ensure player can move freely
      // Clear a larger area to prevent player from getting stuck
      const distanceFromSpawn = Math.sqrt(x * x + y * y)
      if (distanceFromSpawn < 6) {
        continue // No walls or objects near spawn (6 cell radius for safety)
      }
      
      // Randomly place walls
      if (random() < wallDensity) {
        walls.push(new Wall(x, y))
      }
      
      // Decorative objects removed - no longer spawning
    }
  }
  
  // Create boundary walls around the world perimeter
  // Top and bottom edges
  for (let x = -worldSize; x <= worldSize; x++) {
    walls.push(new Wall(x, -worldSize)) // Bottom edge
    walls.push(new Wall(x, worldSize))  // Top edge
  }
  
  // Left and right edges (excluding corners already placed)
  for (let y = -worldSize + 1; y < worldSize; y++) {
    walls.push(new Wall(-worldSize, y)) // Left edge
    walls.push(new Wall(worldSize, y))  // Right edge
  }
  
  // Place exit gate and pressure plate near each other at one of the edges
  // Pressure plate is 3 cells away from exit and not in the direct path
  const edge = Math.floor(random() * 4) // 0=top, 1=bottom, 2=left, 3=right
  let exitX = 0
  let exitY = 0
  let plateX = 0
  let plateY = 0
  
  switch (edge) {
    case 0: // Top edge
      exitX = Math.floor(random() * (worldSize * 2 + 1)) - worldSize
      exitY = worldSize
      // Place pressure plate 3 cells down and offset horizontally (not in direct path)
      plateX = exitX + (random() < 0.5 ? 1 : -1) // Offset left or right
      plateY = exitY - 3 // 3 cells down from exit
      break
    case 1: // Bottom edge
      exitX = Math.floor(random() * (worldSize * 2 + 1)) - worldSize
      exitY = -worldSize
      // Place pressure plate 3 cells up and offset horizontally (not in direct path)
      plateX = exitX + (random() < 0.5 ? 1 : -1) // Offset left or right
      plateY = exitY + 3 // 3 cells up from exit
      break
    case 2: // Left edge
      exitX = -worldSize
      exitY = Math.floor(random() * (worldSize * 2 + 1)) - worldSize
      // Place pressure plate 3 cells right and offset vertically (not in direct path)
      plateX = exitX + 3 // 3 cells right from exit
      plateY = exitY + (random() < 0.5 ? 1 : -1) // Offset up or down
      break
    case 3: // Right edge
      exitX = worldSize
      exitY = Math.floor(random() * (worldSize * 2 + 1)) - worldSize
      // Place pressure plate 3 cells left and offset vertically (not in direct path)
      plateX = exitX - 3 // 3 cells left from exit
      plateY = exitY + (random() < 0.5 ? 1 : -1) // Offset up or down
      break
  }
  
  // Ensure plate coordinates are within bounds
  plateX = Math.max(-worldSize + 1, Math.min(worldSize - 1, plateX))
  plateY = Math.max(-worldSize + 1, Math.min(worldSize - 1, plateY))
  
  // Make sure exit and pressure plate are not blocked by walls (remove walls if present)
  const wallAtExit = walls.find(w => w.gridX === exitX && w.gridY === exitY)
  if (wallAtExit) {
    wallAtExit.destroy()
    walls = walls.filter(w => w !== wallAtExit)
  }
  
  const wallAtPlate = walls.find(w => w.gridX === plateX && w.gridY === plateY)
  if (wallAtPlate) {
    wallAtPlate.destroy()
    walls = walls.filter(w => w !== wallAtPlate)
  }
  
  exitGate = new ExitGate(exitX, exitY)
  pressurePlate = new PressurePlate(plateX, plateY)
  
  // Spawn a block randomly on the map (away from spawn, exit, and pressure plate)
  let blockX = 0
  let blockY = 0
  let attempts = 0
  
  do {
    blockX = Math.floor(random() * (worldSize * 2 - 2)) - (worldSize - 1)
    blockY = Math.floor(random() * (worldSize * 2 - 2)) - (worldSize - 1)
    attempts++
  } while (
    (Math.sqrt(blockX * blockX + blockY * blockY) < 8 || // Too close to spawn
    (blockX === exitX && blockY === exitY) || // At exit
    (blockX === plateX && blockY === plateY) || // At pressure plate
    walls.some(w => w.gridX === blockX && w.gridY === blockY)) && // On a wall
    attempts < 100
  )
  
  const block = new Block(blockX, blockY)
  blocks.push(block)
  
  // Spawn 10 power-ups of each type
  const powerUpTypes: Array<'ghost' | 'freeze' | 'exitView' | 'enemyView'> = ['ghost', 'freeze', 'exitView', 'enemyView']
  const powerUpsPerType = 10
  
  powerUpTypes.forEach(type => {
    for (let i = 0; i < powerUpsPerType; i++) {
      let powerUpX = 0
      let powerUpY = 0
      let attempts = 0
      const maxAttempts = 500 // Increased attempts to ensure we find a valid position
      
      do {
        powerUpX = Math.floor(random() * (worldSize * 2 - 2)) - (worldSize - 1)
        powerUpY = Math.floor(random() * (worldSize * 2 - 2)) - (worldSize - 1)
        attempts++
      } while (
        (Math.sqrt(powerUpX * powerUpX + powerUpY * powerUpY) < 8 || // Too close to spawn
        (powerUpX === exitX && powerUpY === exitY) || // At exit
        (powerUpX === plateX && powerUpY === plateY) || // At pressure plate
        (powerUpX === blockX && powerUpY === blockY) || // At block
        walls.some(w => w.gridX === powerUpX && w.gridY === powerUpY) || // On a wall - CRITICAL CHECK
        powerUps.some(p => p.gridX === powerUpX && p.gridY === powerUpY)) && // On another power-up
        attempts < maxAttempts
      )
      
      if (attempts < maxAttempts) {
        // Double-check that we're not on a wall before spawning
        if (!walls.some(w => w.gridX === powerUpX && w.gridY === powerUpY)) {
          powerUps.push(new PowerUp(powerUpX, powerUpY, type))
        } else {
          console.warn(`Power-up ${type} would spawn on wall at (${powerUpX}, ${powerUpY}), skipping`)
        }
      }
    }
  })
  
  console.log(`Generated world with ${walls.length} walls (including boundary)`)
  console.log(`Exit gate placed at (${exitX}, ${exitY}), pressure plate at (${plateX}, ${plateY}), block at (${blockX}, ${blockY})`)
  console.log(`Spawned ${powerUps.length} power-ups`)
}

// Cached viewport bounds (updated once per frame)
let cachedViewportBounds = {
  minX: 0,
  maxX: 0,
  minY: 0,
  maxY: 0,
  playerGridX: -9999,
  playerGridY: -9999
}

/**
 * Update cached viewport bounds (call once per frame before rendering)
 */
function updateViewportBounds(): void {
  if (!player) return
  
  // Use target position if moving, otherwise use current position
  // This ensures viewport updates during movement, not just after
  const playerGridX = player.isMoving ? player.targetGridX : player.gridX
  const playerGridY = player.isMoving ? player.targetGridY : player.gridY
  
  // Recalculate if player moved to a different grid cell (including during movement)
  if (cachedViewportBounds.playerGridX !== playerGridX || 
      cachedViewportBounds.playerGridY !== playerGridY) {
    const viewportOffsetX = Math.floor(VIEWPORT_WIDTH / 2)
    const viewportOffsetY = Math.floor(VIEWPORT_HEIGHT / 2)
    
    cachedViewportBounds.minX = playerGridX - viewportOffsetX
    cachedViewportBounds.maxX = playerGridX + viewportOffsetX
    cachedViewportBounds.minY = playerGridY - viewportOffsetY
    cachedViewportBounds.maxY = playerGridY + viewportOffsetY
    cachedViewportBounds.playerGridX = playerGridX
    cachedViewportBounds.playerGridY = playerGridY
  }
}

/**
 * Check if an object is in the viewport (uses cached bounds)
 */
function isInViewport(gridX: number, gridY: number): boolean {
  return gridX >= cachedViewportBounds.minX && 
         gridX <= cachedViewportBounds.maxX && 
         gridY >= cachedViewportBounds.minY && 
         gridY <= cachedViewportBounds.maxY
}

/**
 * Update camera to follow player smoothly
 * @param immediate - If true, snap camera to player position immediately (for initialization)
 */
function updateCamera(immediate: boolean = false): void {
  if (!player) return
  
  // Target camera position (player's world position)
  const targetX = player.pos.x
  const targetY = player.pos.y
  
  if (immediate) {
    // Snap camera to player position immediately (for initialization)
    cameraPos.x = targetX
    cameraPos.y = targetY
  } else {
    // Smooth camera following using linear interpolation
    const cameraSpeed = 10 // Higher = faster following, adjust for smoothness
    const dx = targetX - cameraPos.x
    const dy = targetY - cameraPos.y
    
    // Move camera towards target smoothly
    cameraPos.x += dx * cameraSpeed * timeDelta
    cameraPos.y += dy * cameraSpeed * timeDelta
  }
}


/**
 * Update pressure plate and door states
 */
function updatePressurePlate(): void {
  if (!pressurePlate) return
  
  pressurePlate.checkActivation()
}

/**
 * Check if a position is valid for spawning a power-up (not on walls, blocks, exit, etc.)
 */
function isValidPowerUpPosition(gridX: number, gridY: number): boolean {
  const worldSize = 50
  
  // Too close to spawn
  if (Math.sqrt(gridX * gridX + gridY * gridY) < 8) {
    return false
  }
  
  // At exit gate
  if (exitGate && gridX === exitGate.gridX && gridY === exitGate.gridY) {
    return false
  }
  
  // At pressure plate
  if (pressurePlate && gridX === pressurePlate.gridX && gridY === pressurePlate.gridY) {
    return false
  }
  
  // At block
  if (blocks.some(b => b.gridX === gridX && b.gridY === gridY)) {
    return false
  }
  
  // On a wall - CRITICAL: Never spawn on walls
  if (walls.some(w => w.gridX === gridX && w.gridY === gridY)) {
    return false
  }
  
  // On another power-up
  if (powerUps.some(p => p.gridX === gridX && p.gridY === gridY)) {
    return false
  }
  
  // On an enemy
  if (enemies.some(e => e.gridX === gridX && e.gridY === gridY)) {
    return false
  }
  
  return true
}

/**
 * Spawn a new power-up at a random location
 */
function spawnPowerUp(type: 'ghost' | 'freeze' | 'exitView' | 'enemyView'): void {
  const worldSize = 50
  let powerUpX = 0
  let powerUpY = 0
  let attempts = 0
  const maxAttempts = 500 // Increased attempts to ensure we find a valid position
  
  do {
    powerUpX = Math.floor(Math.random() * (worldSize * 2 - 2)) - (worldSize - 1)
    powerUpY = Math.floor(Math.random() * (worldSize * 2 - 2)) - (worldSize - 1)
    attempts++
  } while (!isValidPowerUpPosition(powerUpX, powerUpY) && attempts < maxAttempts)
  
  if (attempts < maxAttempts) {
    powerUps.push(new PowerUp(powerUpX, powerUpY, type))
    console.log(`Power-up respawned at (${powerUpX}, ${powerUpY})`)
  } else {
    console.warn(`Failed to spawn power-up ${type} after ${maxAttempts} attempts`)
  }
}

/**
 * Activate a power-up effect
 */
function activatePowerUp(powerType: 'ghost' | 'freeze' | 'exitView' | 'enemyView'): void {
  if (!player) return
  
  // Prevent duplicate activation - check if already active
  if (powerType === 'ghost' && player.isGhostMode) {
    console.warn('Ghost mode already active, preventing duplicate activation')
    return
  }
  if (powerType === 'freeze' && enemiesFrozen) {
    console.warn('Freeze already active, preventing duplicate activation')
    return
  }
  if (powerType === 'exitView' && exitViewActive) {
    console.warn('Exit view already active, preventing duplicate activation')
    return
  }
  if (powerType === 'enemyView' && enemyViewActive) {
    console.warn('Enemy view already active, preventing duplicate activation')
    return
  }
  
  if (powerType === 'ghost') {
    player.isGhostMode = true
    ghostWallPasses = 3 // 3 wall passes allowed
    console.log('Ghost mode activated! You can pass through 3 walls (excluding border walls)!')
    
    // Check if we need to respawn a power-up (keep at least 5 of each type)
    const ghostPowerUpCount = powerUps.filter(p => p.powerType === 'ghost' && !p.isCollected).length
    if (ghostPowerUpCount <= 5) {
      spawnPowerUp('ghost')
    }
  } else if (powerType === 'freeze') {
    enemiesFrozen = true
    freezeStepsRemaining = 7 // Freeze enemies for 7 player moves
    console.log('Freeze activated! Enemies are frozen for 7 steps!')
    
    // Check if we need to respawn a power-up (keep at least 5 of each type)
    const freezePowerUpCount = powerUps.filter(p => p.powerType === 'freeze' && !p.isCollected).length
    if (freezePowerUpCount <= 5) {
      spawnPowerUp('freeze')
    }
  } else if (powerType === 'exitView') {
    exitViewActive = true
    exitViewStepsRemaining = 7 // Show exit and block for 7 player moves
    console.log('Exit View activated! You can see the exit and block for 7 steps!')
    
    // Check if we need to respawn a power-up (keep at least 5 of each type)
    const exitViewPowerUpCount = powerUps.filter(p => p.powerType === 'exitView' && !p.isCollected).length
    if (exitViewPowerUpCount <= 5) {
      spawnPowerUp('exitView')
    }
  } else if (powerType === 'enemyView') {
    enemyViewActive = true
    enemyViewStepsRemaining = 7 // Show enemy indicators for 7 player moves
    console.log('Enemy View activated! You can see enemy indicators for 7 steps!')
    
    // Check if we need to respawn a power-up (keep at least 5 of each type)
    const enemyViewPowerUpCount = powerUps.filter(p => p.powerType === 'enemyView' && !p.isCollected).length
    if (enemyViewPowerUpCount <= 5) {
      spawnPowerUp('enemyView')
    }
  }
}

/**
 * Move all enemies towards the player (called after player moves)
 */
function moveEnemies(): void {
  if (!player || gameOver || gameWon) return
  
  // Check for collisions FIRST (before any updates) - enemies can kill player when not frozen
  if (!player.isGhostMode && !enemiesFrozen) {
    for (const enemy of enemies) {
      if (enemy.checkCollisionWithPlayer()) {
        triggerGameOver()
        return // Exit immediately if game over triggered
      }
    }
  }
  
  // Update exit view counter (decrement on player move) - check BEFORE resetting flag
  if (playerJustMoved && !player.isMoving && exitViewActive) {
    exitViewStepsRemaining--
    
    if (exitViewStepsRemaining <= 0) {
      exitViewActive = false
      console.log('Exit View effect ended!')
    }
  }
  
  // Update enemy view counter (decrement on player move) - check BEFORE resetting flag
  if (playerJustMoved && !player.isMoving && enemyViewActive) {
    enemyViewStepsRemaining--
    
    if (enemyViewStepsRemaining <= 0) {
      enemyViewActive = false
      console.log('Enemy View effect ended!')
    }
  }
  
  // Only move enemies when player has just finished moving (and not frozen)
  if (playerJustMoved && !player.isMoving && !enemiesFrozen) {
    enemies.forEach(enemy => {
      if (!enemy.isMoving) {
        enemy.moveTowardsPlayer()
      }
      
      // Check for collision with player after each enemy moves (enemies can kill when not frozen)
      if (!enemiesFrozen && enemy.checkCollisionWithPlayer()) {
        triggerGameOver()
        return // Exit early if game over triggered
      }
    })
    
    playerJustMoved = false // Reset flag
  } else if (playerJustMoved && !player.isMoving && enemiesFrozen) {
    // Player moved but enemies are frozen - decrement freeze counter
    freezeStepsRemaining--
    console.log(`Enemies frozen! ${freezeStepsRemaining} steps remaining.`)
    
    if (freezeStepsRemaining <= 0) {
      enemiesFrozen = false
      console.log('Freeze effect ended! Enemies can move again.')
    }
    
    playerJustMoved = false // Reset flag
  }
  
  // Update pressure plate state
  updatePressurePlate()
  
  // Update exit gate state (open/close based on pressure plate)
  if (exitGate) {
    exitGate.update()
  }
  
  // Check for power-up collection
  // Process in reverse order and break immediately after first collection
  // This prevents multiple power-ups from being collected in the same frame
  for (let i = powerUps.length - 1; i >= 0; i--) {
    const powerUp = powerUps[i]
    // Skip if already collected or if we already activated a power-up this frame
    if (powerUp.isCollected || powerUpActivatedThisFrame) continue
    
    // Check collection - this will set isCollected = true if collected
    if (powerUp.checkCollection()) {
      // Verify it was actually marked as collected
      if (powerUp.isCollected) {
        powerUpActivatedThisFrame = true // Set flag before activation
        activatePowerUp(powerUp.powerType)
      }
      // Break immediately after first collection to prevent duplicates
      break
    }
  }
  
  // Ghost mode is now managed by wall pass counter (no timer needed)
  
  // Check if player reached the exit (and exit is open)
  if (exitGate && exitGate.checkPlayerReached()) {
    triggerGameWin()
  }
}

/**
 * Trigger game over and restart with new map
 */
function triggerGameOver(): void {
  if (gameOver || gameWon) return
  
  gameOver = true
  // Ensure callback is called synchronously to show game over screen
  if (setGameOverCallback) {
    setGameOverCallback(true)
  }
  console.log('Game Over!')
}

/**
 * Trigger game win and restart with new map
 */
function triggerGameWin(): void {
  if (gameOver || gameWon) return
  
  gameWon = true
  if (setGameWonCallback) setGameWonCallback(true)
  console.log('You Win!')
}

/**
 * Restart the game with a new randomly generated map
 */
function restartGame(): void {
  // Destroy all existing objects
  if (player) player.destroy()
  enemies.forEach(enemy => enemy.destroy())
  blocks.forEach(block => block.destroy())
  walls.forEach(wall => wall.destroy())
  decorativeObjects.forEach(obj => obj.destroy())
  powerUps.forEach(powerUp => powerUp.destroy())
  if (exitGate) exitGate.destroy()
  if (pressurePlate) pressurePlate.destroy()
  
  // Clear all engine objects
  engineObjects.length = 0
  
  // Reset game state
  player = null
  enemies = []
  blocks = []
  walls = []
  decorativeObjects = []
  powerUps = []
  exitGate = null
  pressurePlate = null
  gameOver = false
  gameWon = false
  if (setGameOverCallback) setGameOverCallback(false)
  if (setGameWonCallback) setGameWonCallback(false)
  playerJustMoved = false
  ghostWallPasses = 0
  enemiesFrozen = false
  freezeStepsRemaining = 0
  exitViewActive = false
  exitViewStepsRemaining = 0
  enemyViewActive = false
  enemyViewStepsRemaining = 0
  
  // Generate new world (with new random seed)
  // This will create new objects and add them to engineObjects
  generateRandomWorld()
  
  // Create new player
  // Note: player was already destroyed and set to null above
  player = new Player()
  // Initialize camera on player immediately (snap to position)
  // Use requestAnimationFrame to ensure player position is set
  requestAnimationFrame(() => {
    if (player) {
      updateCamera(true)
    }
  })
  
  // Create enemies
  enemies = []
  
  // Spawn 2 purple enemies: one near exit, one near block
  const worldSize = 50 // Match generateRandomWorld worldSize
  
  const exitGateForSpawn: ExitGate | null = exitGate
  if (exitGateForSpawn !== null) {
    // Purple enemy near exit (within 8x8 patrol area)
    // Store values to avoid type narrowing issues
    const exitGridX: number = (exitGateForSpawn as ExitGate).gridX
    const exitGridY: number = (exitGateForSpawn as ExitGate).gridY
    let exitEnemyX = exitGridX
    let exitEnemyY = exitGridY
    let attempts = 0
    let foundPosition = false
    
    // Find a position near exit within patrol radius (not on exit itself)
    do {
      exitEnemyX = exitGridX + Math.floor(Math.random() * 9) - 4 // -4 to +4
      exitEnemyY = exitGridY + Math.floor(Math.random() * 9) - 4
      attempts++
      
      // Check if position is valid
      const isOnExit = (exitEnemyX === exitGridX && exitEnemyY === exitGridY)
      const isOnWall = walls.some(w => w.gridX === exitEnemyX && w.gridY === exitEnemyY)
      const isOnEnemy = enemies.some(e => e.gridX === exitEnemyX && e.gridY === exitEnemyY)
      const isOutOfBounds = Math.abs(exitEnemyX) > worldSize || Math.abs(exitEnemyY) > worldSize
      const pressurePlateForCheck: PressurePlate | null = pressurePlate
      const isOnPressurePlate = pressurePlateForCheck !== null ? (exitEnemyX === (pressurePlateForCheck as PressurePlate).gridX && exitEnemyY === (pressurePlateForCheck as PressurePlate).gridY) : false
      
      if (!isOnExit && !isOnWall && !isOnEnemy && !isOutOfBounds && !isOnPressurePlate) {
        foundPosition = true
      }
    } while (!foundPosition && attempts < 200)
    
    if (foundPosition) {
      const exitEnemy = new Enemy(exitEnemyX, exitEnemyY, 'purple')
      enemies.push(exitEnemy)
      console.log(`Purple enemy spawned near exit at (${exitEnemyX}, ${exitEnemyY}), exit at (${exitGridX}, ${exitGridY})`)
    } else {
      console.log(`Failed to spawn purple enemy near exit after ${attempts} attempts. Exit at (${exitGridX}, ${exitGridY})`)
    }
  } else {
    console.log('No exitGate found when trying to spawn purple enemy')
  }
  
  if (blocks.length > 0) {
    const block = blocks[0]
    // Purple enemy near block (within 8x8 patrol area)
    let blockEnemyX = block.gridX
    let blockEnemyY = block.gridY
    let attempts = 0
    let foundPosition = false
    
    // Find a position near block within patrol radius (not on block itself)
    do {
      blockEnemyX = block.gridX + Math.floor(Math.random() * 9) - 4 // -4 to +4
      blockEnemyY = block.gridY + Math.floor(Math.random() * 9) - 4
      attempts++
      
      // Check if position is valid
      const isOnBlock = (blockEnemyX === block.gridX && blockEnemyY === block.gridY)
      const isOnWall = walls.some(w => w.gridX === blockEnemyX && w.gridY === blockEnemyY)
      const isOnEnemy = enemies.some(e => e.gridX === blockEnemyX && e.gridY === blockEnemyY)
      const isOutOfBounds = Math.abs(blockEnemyX) > worldSize || Math.abs(blockEnemyY) > worldSize
      const currentExitGateForBlock: ExitGate | null = exitGate
      const currentPressurePlateForBlock: PressurePlate | null = pressurePlate
      const isOnExit = currentExitGateForBlock !== null ? (blockEnemyX === (currentExitGateForBlock as ExitGate).gridX && blockEnemyY === (currentExitGateForBlock as ExitGate).gridY) : false
      const isOnPressurePlate = currentPressurePlateForBlock !== null ? (blockEnemyX === (currentPressurePlateForBlock as PressurePlate).gridX && blockEnemyY === (currentPressurePlateForBlock as PressurePlate).gridY) : false
      
      if (!isOnBlock && !isOnWall && !isOnEnemy && !isOutOfBounds && !isOnExit && !isOnPressurePlate) {
        foundPosition = true
      }
    } while (!foundPosition && attempts < 200)
    
    if (foundPosition) {
      const blockEnemy = new Enemy(blockEnemyX, blockEnemyY, 'purple')
      enemies.push(blockEnemy)
      console.log(`Purple enemy spawned near block at (${blockEnemyX}, ${blockEnemyY}), block at (${block.gridX}, ${block.gridY})`)
    } else {
      console.log(`Failed to spawn purple enemy near block after ${attempts} attempts. Block at (${block.gridX}, ${block.gridY})`)
    }
  } else {
    console.log('No blocks found when trying to spawn purple enemy')
  }
  
  // Spawn orange enemies (followers) at random positions
  const numOrangeEnemies = 2 + Math.floor(Math.random() * 3) // 2-4 orange enemies
  
  for (let i = 0; i < numOrangeEnemies; i++) {
    let enemyX = 0
    let enemyY = 0
    let attempts = 0
    
    // Find a valid position away from spawn, exit, and other enemies
    do {
      enemyX = Math.floor(Math.random() * 40) - 20 // Random between -20 and 20
      enemyY = Math.floor(Math.random() * 40) - 20
      attempts++
    } while (
      (Math.sqrt(enemyX * enemyX + enemyY * enemyY) < 8 || // Too close to spawn
      (() => {
        const eg: ExitGate | null = exitGate
        if (eg === null) return false
        return Math.sqrt((enemyX - (eg as ExitGate).gridX) ** 2 + (enemyY - (eg as ExitGate).gridY) ** 2) < 5
      })() || // Too close to exit
      walls.some(w => w.gridX === enemyX && w.gridY === enemyY) || // On a wall
      enemies.some(e => e.gridX === enemyX && e.gridY === enemyY)) && // On another enemy
      attempts < 50
    )
    
    if (attempts < 50) {
      const enemy = new Enemy(enemyX, enemyY, 'orange')
      enemies.push(enemy)
    }
  }
  
  console.log(`Game restarted with new map! ${enemies.length} enemies spawned (${enemies.filter(e => e.enemyType === 'orange').length} orange, ${enemies.filter(e => e.enemyType === 'purple').length} purple).`)
}


// Reusable objects for arrow drawing (avoid allocations)
const exitArrowColor = new Color(0.2, 0.8, 0.2, 1)
const blockArrowColor = new Color(0.2, 0.4, 0.9, 1)
const arrowVec1 = new Vector2(0, 0)
const arrowVec2 = new Vector2(0, 0)
const arrowVec3 = new Vector2(0, 0)
const arrowVec4 = new Vector2(0, 0)

/**
 * Draw arrows pointing to exit and block when exit view is active
 */
function drawExitViewArrows(): void {
  if (!player || !exitGate) return
  
  const playerWorldX = player.pos.x
  const playerWorldY = player.pos.y
  
  // Draw arrow to exit
  const exitWorldX = exitGate.pos.x
  const exitWorldY = exitGate.pos.y
  
  const dx = exitWorldX - playerWorldX
  const dy = exitWorldY - playerWorldY
  const distanceSq = dx * dx + dy * dy
  
  if (distanceSq > 0.01) { // Use squared distance to avoid sqrt
    const viewportSize = VIEWPORT_WIDTH * GRID_SIZE / 2
    const arrowDistance = viewportSize * 0.8
    const angle = Math.atan2(dy, dx)
    
    const arrowX = playerWorldX + Math.cos(angle) * arrowDistance
    const arrowY = playerWorldY + Math.sin(angle) * arrowDistance
    
    // Draw arrow line (reuse Vector2 objects)
    arrowVec1.x = playerWorldX
    arrowVec1.y = playerWorldY
    arrowVec2.x = arrowX
    arrowVec2.y = arrowY
    drawLine(arrowVec1, arrowVec2, 0.05, exitArrowColor)
    
    // Draw arrowhead
    const arrowHeadSize = 0.2
    const headAngle1 = angle + Math.PI * 0.8
    const headAngle2 = angle - Math.PI * 0.8
    
    arrowVec3.x = arrowX - Math.cos(headAngle1) * arrowHeadSize
    arrowVec3.y = arrowY - Math.sin(headAngle1) * arrowHeadSize
    arrowVec4.x = arrowX - Math.cos(headAngle2) * arrowHeadSize
    arrowVec4.y = arrowY - Math.sin(headAngle2) * arrowHeadSize
    
    arrowVec1.x = arrowX
    arrowVec1.y = arrowY
    drawLine(arrowVec1, arrowVec3, 0.05, exitArrowColor)
    drawLine(arrowVec1, arrowVec4, 0.05, exitArrowColor)
  }
  
  // Draw arrow to block
  if (blocks.length > 0) {
    const block = blocks[0]
    const blockWorldX = block.pos.x
    const blockWorldY = block.pos.y
    
    const blockDx = blockWorldX - playerWorldX
    const blockDy = blockWorldY - playerWorldY
    const blockDistanceSq = blockDx * blockDx + blockDy * blockDy
    
    if (blockDistanceSq > 0.01) {
      const blockAngle = Math.atan2(blockDy, blockDx)
      const viewportSize = VIEWPORT_WIDTH * GRID_SIZE / 2
      const arrowDistance = viewportSize * 0.8
      
      // Offset angle slightly to avoid overlap with exit arrow
      const offsetAngle = blockAngle + (Math.PI / 6)
      const arrowX = playerWorldX + Math.cos(offsetAngle) * arrowDistance
      const arrowY = playerWorldY + Math.sin(offsetAngle) * arrowDistance
      
      // Draw arrow line
      arrowVec1.x = playerWorldX
      arrowVec1.y = playerWorldY
      arrowVec2.x = arrowX
      arrowVec2.y = arrowY
      drawLine(arrowVec1, arrowVec2, 0.05, blockArrowColor)
      
      // Draw arrowhead
      const arrowHeadSize = 0.2
      const headAngle1 = offsetAngle + Math.PI * 0.8
      const headAngle2 = offsetAngle - Math.PI * 0.8
      
      arrowVec3.x = arrowX - Math.cos(headAngle1) * arrowHeadSize
      arrowVec3.y = arrowY - Math.sin(headAngle1) * arrowHeadSize
      arrowVec4.x = arrowX - Math.cos(headAngle2) * arrowHeadSize
      arrowVec4.y = arrowY - Math.sin(headAngle2) * arrowHeadSize
      
      arrowVec1.x = arrowX
      arrowVec1.y = arrowY
      drawLine(arrowVec1, arrowVec3, 0.05, blockArrowColor)
      drawLine(arrowVec1, arrowVec4, 0.05, blockArrowColor)
    }
  }
}

// Reusable objects for enemy indicators
const purpleIndicatorColor = new Color(0.7, 0.3, 0.9, 0.8)
const orangeIndicatorColor = new Color(0.9, 0.5, 0.2, 0.8)
const indicatorVec1 = new Vector2(0, 0)
const indicatorVec2 = new Vector2(0, 0)

/**
 * Draw indicators for enemies outside viewport when enemy view is active
 */
function drawEnemyViewIndicators(): void {
  if (!player || !enemyViewActive) return
  
  const playerWorldX = player.pos.x
  const playerWorldY = player.pos.y
  const viewportSize = VIEWPORT_WIDTH * GRID_SIZE / 2
  const indicatorDistance = viewportSize * 0.85
  
  for (let i = 0; i < enemies.length; i++) {
    const enemy = enemies[i]
    
    // Only show indicator if enemy is outside viewport
    if (isInViewport(enemy.gridX, enemy.gridY)) continue
    
    const enemyWorldX = enemy.pos.x
    const enemyWorldY = enemy.pos.y
    
    const dx = enemyWorldX - playerWorldX
    const dy = enemyWorldY - playerWorldY
    const distanceSq = dx * dx + dy * dy
    
    if (distanceSq > 0.01) {
      const angle = Math.atan2(dy, dx)
      
      const indicatorX = playerWorldX + Math.cos(angle) * indicatorDistance
      const indicatorY = playerWorldY + Math.sin(angle) * indicatorDistance
      
      // Use different color based on enemy type
      const indicatorColor = enemy.enemyType === 'purple' ? purpleIndicatorColor : orangeIndicatorColor
      
      // Draw small indicator dot
      indicatorVec1.x = indicatorX
      indicatorVec1.y = indicatorY
      drawCircle(indicatorVec1, 0.15, indicatorColor)
      
      // Draw small line pointing in direction
      const lineLength = 0.2
      indicatorVec2.x = indicatorX + Math.cos(angle) * lineLength
      indicatorVec2.y = indicatorY + Math.sin(angle) * lineLength
      
      drawLine(indicatorVec1, indicatorVec2, 0.03, indicatorColor)
    }
  }
}

/**
 * Draw the grid viewport around the player (7x7 visible area)
 */
// Reusable color objects for grid (created once, reused every frame)
const gridColor = new Color(0.7, 0.7, 0.7, 0.6)
const borderColor = new Color(0.3, 0.3, 0.3, 0.5)

// Reusable Vector2 objects for grid drawing (reused to avoid allocations)
const gridVec1 = new Vector2(0, 0)
const gridVec2 = new Vector2(0, 0)

function drawGrid(): void {
  if (!player) return
  
  // Use cached viewport bounds
  const startGridX = cachedViewportBounds.minX
  const endGridX = cachedViewportBounds.maxX
  const startGridY = cachedViewportBounds.minY
  const endGridY = cachedViewportBounds.maxY
  
  // Convert to world coordinates
  const startX = startGridX * GRID_SIZE
  const endX = (endGridX + 1) * GRID_SIZE
  const startY = startGridY * GRID_SIZE
  const endY = (endGridY + 1) * GRID_SIZE
  
  // Draw vertical lines for visible viewport (reuse Vector2 objects)
  for (let x = startGridX; x <= endGridX + 1; x++) {
    const worldX = x * GRID_SIZE
    gridVec1.x = worldX
    gridVec1.y = startY
    gridVec2.x = worldX
    gridVec2.y = endY
    drawLine(gridVec1, gridVec2, 0.02, gridColor)
  }
  
  // Draw horizontal lines for visible viewport
  for (let y = startGridY; y <= endGridY + 1; y++) {
    const worldY = y * GRID_SIZE
    gridVec1.x = startX
    gridVec1.y = worldY
    gridVec2.x = endX
    gridVec2.y = worldY
    drawLine(gridVec1, gridVec2, 0.02, gridColor)
  }
  
  // Draw viewport border
  const borderWidth = 0.05
  
  // Top border
  gridVec1.x = startX
  gridVec1.y = endY
  gridVec2.x = endX
  gridVec2.y = endY
  drawLine(gridVec1, gridVec2, borderWidth, borderColor)
  
  // Bottom border
  gridVec1.y = startY
  gridVec2.y = startY
  drawLine(gridVec1, gridVec2, borderWidth, borderColor)
  
  // Left border
  gridVec1.x = startX
  gridVec1.y = startY
  gridVec2.x = startX
  gridVec2.y = endY
  drawLine(gridVec1, gridVec2, borderWidth, borderColor)
  
  // Right border
  gridVec1.x = endX
  gridVec2.x = endX
  drawLine(gridVec1, gridVec2, borderWidth, borderColor)
}

/**
 * Game Component
 * 
 * This component initializes and manages the LittleJS game engine
 * with a grid-based 2D game featuring a square character.
 */
function Game() {
  const gameContainerRef = useRef<HTMLDivElement>(null)
  const [showMenu, setShowMenu] = useState(true)
  const [gameOverState, setGameOverState] = useState(false)
  const [gameWonState, setGameWonState] = useState(false)
  const { theme } = useTheme()
  
  // Set callbacks for LittleJS to update React state
  useEffect(() => {
    setGameOverCallback = setGameOverState
    setGameWonCallback = setGameWonState
    setShowMenuCallback = setShowMenu
    
    return () => {
      setGameOverCallback = null
      setGameWonCallback = null
      setShowMenuCallback = null
    }
  }, [])

  // Mobile swipe controls
  useEffect(() => {
    if (!gameContainerRef.current || showMenu) return

    const container = gameContainerRef.current

    const handleTouchStart = (e: TouchEvent) => {
      // Only handle if there's a single touch
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX
        touchStartY = e.touches[0].clientY
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      // Only handle if there was a single touch
      if (e.changedTouches.length === 1 && touchStartX !== 0 && touchStartY !== 0) {
        // Only register swipe if player exists and is not currently moving
        if (player && !player.isMoving && !swipeDirection) {
          const touchEndX = e.changedTouches[0].clientX
          const touchEndY = e.changedTouches[0].clientY
          
          const deltaX = touchEndX - touchStartX
          const deltaY = touchEndY - touchStartY
          
          const absDeltaX = Math.abs(deltaX)
          const absDeltaY = Math.abs(deltaY)
          
          // Determine swipe direction based on the larger movement
          // Only register swipe if movement exceeds threshold
          if (absDeltaX > SWIPE_THRESHOLD || absDeltaY > SWIPE_THRESHOLD) {
            if (absDeltaX > absDeltaY) {
              // Horizontal swipe
              swipeDirection = deltaX > 0 ? 'right' : 'left'
            } else {
              // Vertical swipe
              swipeDirection = deltaY > 0 ? 'down' : 'up'
            }
          }
        }
        
        // Reset touch start positions
        touchStartX = 0
        touchStartY = 0
      } else {
        // Reset touch start positions even if swipe wasn't registered
        touchStartX = 0
        touchStartY = 0
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      // Prevent default scrolling behavior during game
      if (!showMenu) {
        e.preventDefault()
      }
    }

    // Add touch event listeners
    container.addEventListener('touchstart', handleTouchStart, { passive: false })
    container.addEventListener('touchend', handleTouchEnd, { passive: true })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchend', handleTouchEnd)
      container.removeEventListener('touchmove', handleTouchMove)
    }
  }, [showMenu])

  // Update canvas background when theme changes
  useEffect(() => {
    if (!showMenu) {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'light'
      const bgColor = currentTheme === 'dark' ? new Color(0.1, 0.1, 0.1, 1) : WHITE
      setCanvasClearColor(bgColor)
    }
  }, [theme, showMenu])

  // Handle window resize for mobile devices (address bar show/hide)
  useEffect(() => {
    if (showMenu) return

    const handleResize = () => {
      // Force canvas to resize on mobile viewport changes
      const canvas = document.querySelector('canvas')
      if (canvas && gameContainerRef.current) {
        const container = gameContainerRef.current
        const containerWidth = container.clientWidth
        const containerHeight = container.clientHeight
        
        // Update canvas size to match container
        canvas.style.width = `${containerWidth}px`
        canvas.style.height = `${containerHeight}px`
      }
    }

    // Use ResizeObserver for better mobile support
    let resizeObserver: ResizeObserver | null = null
    if (gameContainerRef.current && 'ResizeObserver' in window) {
      resizeObserver = new ResizeObserver(handleResize)
      resizeObserver.observe(gameContainerRef.current)
    }

    // Also listen to window resize as fallback
    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)

    // Initial resize
    handleResize()

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
      if (resizeObserver && gameContainerRef.current) {
        resizeObserver.unobserve(gameContainerRef.current)
      }
    }
  }, [showMenu])

  useEffect(() => {
    // Only initialize game if menu is not showing
    if (showMenu || !gameContainerRef.current) {
      return
    }

    let isMounted = true

    // Initialize LittleJS game engine
    const initGame = async () => {
      try {
        await engineInit(
          // gameInit - Called once when the engine starts
          () => {
            console.log('Tutorial Level initialized!')
            
            // Set canvas background based on current theme
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'light'
            const bgColor = currentTheme === 'dark' ? new Color(0.1, 0.1, 0.1, 1) : WHITE
            setCanvasClearColor(bgColor)
            
            // Destroy all existing objects first
            if (player) {
              try {
                player.destroy()
              } catch (e) {
                console.warn('Error destroying player:', e)
              }
              player = null
            }
            
            // Destroy all other game objects
            walls.forEach(wall => wall.destroy())
            blocks.forEach(block => block.destroy())
            enemies.forEach(enemy => enemy.destroy())
            powerUps.forEach(powerUp => powerUp.destroy())
            if (exitGate) exitGate.destroy()
            if (pressurePlate) pressurePlate.destroy()
            
            // Reset game state arrays
            blocks = []
            doors = []
            enemies = []
            walls = []
            powerUps = []
            exitGate = null
            pressurePlate = null
            gameOver = false
            gameWon = false
            playerJustMoved = false
            enemiesFrozen = false
            freezeStepsRemaining = 0
            exitViewActive = false
            exitViewStepsRemaining = 0
            enemyViewActive = false
            enemyViewStepsRemaining = 0
            if (setGameOverCallback) setGameOverCallback(false)
            if (setGameWonCallback) setGameWonCallback(false)
            
            // Randomly generate the world FIRST (includes walls, decorative objects, and exit gate)
            // This will create new objects and add them to engineObjects
            generateRandomWorld()
            
            // Create the player at grid position (0, 0) AFTER world generation
            player = new Player()
            
            // Initialize camera on player immediately (snap to position)
            // Wait a frame to ensure player position is set
            setTimeout(() => {
              if (player) {
                updateCamera(true)
              }
            }, 0)
            
            // Create enemies
            enemies = []
            
            // Spawn 2 purple enemies: one near exit, one near block
            const worldSize = 50 // Match generateRandomWorld worldSize
            
            if (exitGate) {
              // Purple enemy near exit (within 8x8 patrol area)
              const exitGateForSpawn = exitGate as ExitGate
              let exitEnemyX = exitGateForSpawn.gridX
              let exitEnemyY = exitGateForSpawn.gridY
              let attempts = 0
              let foundPosition = false
              
              // Find a position near exit within patrol radius (not on exit itself)
              do {
                exitEnemyX = exitGateForSpawn.gridX + Math.floor(Math.random() * 9) - 4 // -4 to +4
                exitEnemyY = exitGateForSpawn.gridY + Math.floor(Math.random() * 9) - 4
                attempts++
                
                // Check if position is valid
                const isOnExit = (exitEnemyX === exitGateForSpawn.gridX && exitEnemyY === exitGateForSpawn.gridY)
                const isOnWall = walls.some(w => w.gridX === exitEnemyX && w.gridY === exitEnemyY)
                const isOnEnemy = enemies.some(e => e.gridX === exitEnemyX && e.gridY === exitEnemyY)
                const isOutOfBounds = Math.abs(exitEnemyX) > worldSize || Math.abs(exitEnemyY) > worldSize
                const currentPressurePlate = pressurePlate
                const isOnPressurePlate = currentPressurePlate !== null && exitEnemyX === (currentPressurePlate as PressurePlate).gridX && exitEnemyY === (currentPressurePlate as PressurePlate).gridY
                
                if (!isOnExit && !isOnWall && !isOnEnemy && !isOutOfBounds && !isOnPressurePlate) {
                  foundPosition = true
                }
              } while (!foundPosition && attempts < 200)
              
              if (foundPosition) {
                const exitEnemy = new Enemy(exitEnemyX, exitEnemyY, 'purple')
                enemies.push(exitEnemy)
                const exitGateForLog = exitGate as ExitGate
                console.log(`Purple enemy spawned near exit at (${exitEnemyX}, ${exitEnemyY}), exit at (${exitGateForLog.gridX}, ${exitGateForLog.gridY})`)
              } else {
                const exitGateForLog = exitGate as ExitGate
                console.log(`Failed to spawn purple enemy near exit after ${attempts} attempts. Exit at (${exitGateForLog.gridX}, ${exitGateForLog.gridY})`)
              }
            } else {
              console.log('No exitGate found when trying to spawn purple enemy')
            }
            
            if (blocks.length > 0) {
              const block = blocks[0]
              // Purple enemy near block (within 8x8 patrol area)
              let blockEnemyX = block.gridX
              let blockEnemyY = block.gridY
              let attempts = 0
              let foundPosition = false
              
              // Find a position near block within patrol radius (not on block itself)
              do {
                blockEnemyX = block.gridX + Math.floor(Math.random() * 9) - 4 // -4 to +4
                blockEnemyY = block.gridY + Math.floor(Math.random() * 9) - 4
                attempts++
                
                // Check if position is valid
                const isOnBlock = (blockEnemyX === block.gridX && blockEnemyY === block.gridY)
                const isOnWall = walls.some(w => w.gridX === blockEnemyX && w.gridY === blockEnemyY)
                const isOnEnemy = enemies.some(e => e.gridX === blockEnemyX && e.gridY === blockEnemyY)
                const isOutOfBounds = Math.abs(blockEnemyX) > worldSize || Math.abs(blockEnemyY) > worldSize
                const currentExitGate = exitGate
                const currentPressurePlate = pressurePlate
                const isOnExit = currentExitGate !== null && blockEnemyX === (currentExitGate as ExitGate).gridX && blockEnemyY === (currentExitGate as ExitGate).gridY
                const isOnPressurePlate = currentPressurePlate !== null && blockEnemyX === (currentPressurePlate as PressurePlate).gridX && blockEnemyY === (currentPressurePlate as PressurePlate).gridY
                
                if (!isOnBlock && !isOnWall && !isOnEnemy && !isOutOfBounds && !isOnExit && !isOnPressurePlate) {
                  foundPosition = true
                }
              } while (!foundPosition && attempts < 200)
              
              if (foundPosition) {
                const blockEnemy = new Enemy(blockEnemyX, blockEnemyY, 'purple')
                enemies.push(blockEnemy)
                console.log(`Purple enemy spawned near block at (${blockEnemyX}, ${blockEnemyY}), block at (${block.gridX}, ${block.gridY})`)
              } else {
                console.log(`Failed to spawn purple enemy near block after ${attempts} attempts. Block at (${block.gridX}, ${block.gridY})`)
              }
            } else {
              console.log('No blocks found when trying to spawn purple enemy')
            }
            
            // Spawn orange enemies (followers) at random positions
            const numOrangeEnemies = 2 + Math.floor(Math.random() * 3) // 2-4 orange enemies
            
            for (let i = 0; i < numOrangeEnemies; i++) {
              let enemyX = 0
              let enemyY = 0
              let attempts = 0
              
              // Find a valid position away from spawn, exit, and other enemies
              do {
                enemyX = Math.floor(Math.random() * 40) - 20 // Random between -20 and 20
                enemyY = Math.floor(Math.random() * 40) - 20
                attempts++
              } while (
                (Math.sqrt(enemyX * enemyX + enemyY * enemyY) < 8 || // Too close to spawn
                (exitGate !== null && Math.sqrt((enemyX - (exitGate as ExitGate).gridX) ** 2 + (enemyY - (exitGate as ExitGate).gridY) ** 2) < 5) || // Too close to exit
                walls.some(w => w.gridX === enemyX && w.gridY === enemyY) || // On a wall
                enemies.some(e => e.gridX === enemyX && e.gridY === enemyY)) && // On another enemy
                attempts < 50
              )
              
              if (attempts < 50) {
                const enemy = new Enemy(enemyX, enemyY, 'orange')
                enemies.push(enemy)
              }
            }
            
            console.log(`Game initialized! ${enemies.length} enemies spawned (${enemies.filter(e => e.enemyType === 'orange').length} orange, ${enemies.filter(e => e.enemyType === 'purple').length} purple).`)
          },

          // gameUpdate - Called every frame to update game logic
          () => {
            // Reset power-up activation flag at start of each frame
            powerUpActivatedThisFrame = false
            
            // Don't update game logic if game is over or won
            if (gameOver || gameWon) return
            
            // Update cached viewport bounds once per frame
            updateViewportBounds()
            
            // Update power-up pulse cache (less frequently to reduce Date.now() calls)
            const now = Date.now()
            if (now - powerUpPulseCache.time > POWER_UP_PULSE_UPDATE_INTERVAL) {
              const time = now / 500 // Pulse every 500ms
              powerUpPulseCache.pulse = 0.5 + Math.sin(time) * 0.2
              powerUpPulseCache.innerPulse = powerUpPulseCache.pulse
              powerUpPulseCache.time = now
            }
            
            // Update ghost mode color alpha (if player is in ghost mode)
            if (player && player.isGhostMode) {
              const ghostTime = now / 200 // Pulse faster
              reusableGhostColor.a = 0.3 + Math.sin(ghostTime) * 0.2
            }
            
            // Check collisions when player is not in ghost mode and enemies are not frozen
            // Check every frame to ensure collisions are detected immediately
            if (player && !player.isGhostMode && !enemiesFrozen && !gameOver && !gameWon) {
              for (let i = 0; i < enemies.length; i++) {
                if (enemies[i].checkCollisionWithPlayer()) {
                  triggerGameOver()
                  return // Exit immediately if game over triggered
                }
              }
            }
            
            // Update camera to follow player
            updateCamera()
            
            // Move enemies after player moves
            moveEnemies()
          },

          // gameUpdatePost - Called after objects are updated
          () => {
            // Post-update logic (e.g., UI updates)
          },

          // gameRender - Called every frame to render the game
          () => {
            // Update viewport bounds for rendering (in case it wasn't updated in gameUpdate)
            updateViewportBounds()
            
            // Draw the grid background
            drawGrid()
            
            // Draw exit view arrows if active
            if (exitViewActive) {
              drawExitViewArrows()
            }
            
            // Draw enemy view indicators if active
            if (enemyViewActive) {
              drawEnemyViewIndicators()
            }
          },

          // gameRenderPost - Called after objects are rendered
          () => {
            // Post-render logic (e.g., UI overlays, debug info)
          },

          // imageSources - Images to preload (optional)
          [],

          // rootElement - The DOM element to attach the canvas to
          gameContainerRef.current || undefined
        )
      } catch (error) {
        console.error('Failed to initialize game:', error)
      }
    }

    // Start the game only if menu is not showing
    if (isMounted && !showMenu) {
      initGame()
    }

    // Cleanup function - called when component unmounts
    return () => {
      isMounted = false
      player = null
    }
  }, [showMenu])
  
  // Handle menu start
  const handleStartGame = () => {
    // Always reset game states first
    setGameOverState(false)
    setGameWonState(false)
    // Reset game state to prevent stuck positions
    restartGame()
    // Hide menu to start game
    setShowMenu(false)
  }
  
  // Handle restart from game over/victory
  const handleRestart = () => {
    setGameOverState(false)
    setGameWonState(false)
    restartGame()
  }
  
  // Handle return to menu
  const handleMenu = () => {
    setGameOverState(false)
    setGameWonState(false)
    setShowMenu(true)
    // Don't call restartGame() here - it will be called when starting a new game
    // This prevents interfering with the game over screen display
  }
  
  // Handle next level (victory)
  const handleNextLevel = () => {
    setGameWonState(false)
    restartGame()
  }
  
  return (
    <div className="game-wrapper" style={{ position: 'relative', width: '100%', height: '100%', margin: 0, padding: 0 }}>
      <div 
        ref={gameContainerRef} 
        style={{ 
          width: '100%', 
          height: '100%', 
          margin: 0, 
          padding: 0,
          position: 'relative',
          zIndex: showMenu ? -1 : 1,
          pointerEvents: showMenu ? 'none' : 'auto'
        }} 
      />
      {showMenu && <MenuScreen onStart={handleStartGame} />}
      {gameOverState && <GameOverScreen onRestart={handleRestart} onMenu={handleMenu} />}
      {gameWonState && <VictoryScreen onNext={handleNextLevel} onMenu={handleMenu} />}
    </div>
  )
}

export default Game
