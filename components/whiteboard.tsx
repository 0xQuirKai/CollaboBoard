"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Circle, ImageIcon, Pencil, Square, Minus, Undo2, Redo2, Trash2, Download, Users } from "lucide-react"
import ColorPicker from "./color-picker"
import ImageUploader from "./image-uploader"

type Tool = "pencil" | "rectangle" | "circle" | "line" | "image" | "select"
type DrawingElement = {
  id: string
  type: Tool
  points?: { x: number; y: number }[]
  x?: number
  y?: number
  width?: number
  height?: number
  color: string
  lineWidth: number
  imageUrl?: string
  selected?: boolean
}

export default function Whiteboard() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null)
  const [tool, setTool] = useState<Tool>("pencil")
  const [color, setColor] = useState("#000000")
  const [lineWidth, setLineWidth] = useState([3])
  const [elements, setElements] = useState<DrawingElement[]>([])
  const [history, setHistory] = useState<DrawingElement[][]>([])
  const [redoStack, setRedoStack] = useState<DrawingElement[][]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [selectedElement, setSelectedElement] = useState<DrawingElement | null>(null)

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    setContext(ctx)

    // Set canvas size
    const resizeCanvas = () => {
      const parent = canvas.parentElement
      if (!parent) return

      canvas.width = parent.clientWidth
      canvas.height = parent.clientHeight

      // Redraw everything when canvas is resized
      drawElements(ctx, elements)
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    return () => {
      window.removeEventListener("resize", resizeCanvas)
    }
  }, [elements])

  // Draw grid background
  useEffect(() => {
    if (!context || !canvasRef.current) return

    const drawGrid = () => {
      const canvas = canvasRef.current
      if (!canvas || !context) return

      const width = canvas.width
      const height = canvas.height
      const gridSize = 20

      context.clearRect(0, 0, width, height)

      // Draw grid
      context.beginPath()
      context.strokeStyle = "#e5e7eb" // Light gray
      context.lineWidth = 1

      // Vertical lines
      for (let x = 0; x <= width; x += gridSize) {
        context.moveTo(x, 0)
        context.lineTo(x, height)
      }

      // Horizontal lines
      for (let y = 0; y <= height; y += gridSize) {
        context.moveTo(0, y)
        context.lineTo(width, y)
      }

      context.stroke()

      // Draw all elements
      drawElements(context, elements)
    }

    drawGrid()
  }, [context, elements])

  // Draw all elements
  const drawElements = (ctx: CanvasRenderingContext2D, elements: DrawingElement[]) => {
    elements.forEach((element) => {
      ctx.strokeStyle = element.color
      ctx.lineWidth = element.lineWidth
      ctx.fillStyle = element.color

      switch (element.type) {
        case "pencil":
          if (!element.points || element.points.length < 2) return

          ctx.beginPath()
          ctx.moveTo(element.points[0].x, element.points[0].y)

          for (let i = 1; i < element.points.length; i++) {
            ctx.lineTo(element.points[i].x, element.points[i].y)
          }

          ctx.stroke()
          break

        case "rectangle":
          if (
            element.x === undefined ||
            element.y === undefined ||
            element.width === undefined ||
            element.height === undefined
          )
            return

          ctx.beginPath()
          ctx.rect(element.x, element.y, element.width, element.height)
          ctx.stroke()

          // Draw selection handles if selected
          if (element.selected) {
            drawSelectionHandles(ctx, element)
          }
          break

        case "circle":
          if (
            element.x === undefined ||
            element.y === undefined ||
            element.width === undefined ||
            element.height === undefined
          )
            return

          const radiusX = element.width / 2
          const radiusY = element.height / 2
          const centerX = element.x + radiusX
          const centerY = element.y + radiusY

          ctx.beginPath()
          ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI)
          ctx.stroke()

          // Draw selection handles if selected
          if (element.selected) {
            drawSelectionHandles(ctx, element)
          }
          break

        case "line":
          if (!element.points || element.points.length < 2) return

          ctx.beginPath()
          ctx.moveTo(element.points[0].x, element.points[0].y)
          ctx.lineTo(element.points[1].x, element.points[1].y)
          ctx.stroke()

          // Draw selection handles if selected
          if (element.selected) {
            drawSelectionHandles(ctx, {
              ...element,
              x: Math.min(element.points[0].x, element.points[1].x),
              y: Math.min(element.points[0].y, element.points[1].y),
              width: Math.abs(element.points[1].x - element.points[0].x),
              height: Math.abs(element.points[1].y - element.points[0].y),
            })
          }
          break

        case "image":
          if (
            element.x === undefined ||
            element.y === undefined ||
            element.width === undefined ||
            element.height === undefined ||
            !element.imageUrl
          )
            return

          const img = new Image()
          img.src = element.imageUrl
          img.crossOrigin = "anonymous"

          img.onload = () => {
            ctx.drawImage(img, element.x!, element.y!, element.width!, element.height!)

            // Draw selection handles if selected
            if (element.selected) {
              drawSelectionHandles(ctx, element)
            }
          }
          break
      }
    })
  }

  // Draw selection handles around selected element
  const drawSelectionHandles = (ctx: CanvasRenderingContext2D, element: DrawingElement) => {
    if (
      element.x === undefined ||
      element.y === undefined ||
      element.width === undefined ||
      element.height === undefined
    )
      return

    // Draw selection rectangle
    ctx.setLineDash([5, 5])
    ctx.strokeStyle = "#3b82f6" // Blue
    ctx.lineWidth = 1
    ctx.strokeRect(element.x - 5, element.y - 5, element.width + 10, element.height + 10)
    ctx.setLineDash([])

    // Draw handles
    const handleSize = 8
    ctx.fillStyle = "#3b82f6" // Blue

    // Corner handles
    ctx.fillRect(element.x - handleSize / 2, element.y - handleSize / 2, handleSize, handleSize)
    ctx.fillRect(element.x + element.width - handleSize / 2, element.y - handleSize / 2, handleSize, handleSize)
    ctx.fillRect(element.x - handleSize / 2, element.y + element.height - handleSize / 2, handleSize, handleSize)
    ctx.fillRect(
      element.x + element.width - handleSize / 2,
      element.y + element.height - handleSize / 2,
      handleSize,
      handleSize,
    )

    // Middle handles
    ctx.fillRect(element.x + element.width / 2 - handleSize / 2, element.y - handleSize / 2, handleSize, handleSize)
    ctx.fillRect(
      element.x + element.width / 2 - handleSize / 2,
      element.y + element.height - handleSize / 2,
      handleSize,
      handleSize,
    )
    ctx.fillRect(element.x - handleSize / 2, element.y + element.height / 2 - handleSize / 2, handleSize, handleSize)
    ctx.fillRect(
      element.x + element.width - handleSize / 2,
      element.y + element.height / 2 - handleSize / 2,
      handleSize,
      handleSize,
    )
  }

  // Handle mouse down event
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return

    setIsDrawing(true)
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setStartPoint({ x, y })

    if (tool === "select") {
      // Check if clicked on an element
      const clickedElement = elements.findLast((el) => {
        if (el.x === undefined || el.y === undefined || el.width === undefined || el.height === undefined) return false

        return x >= el.x && x <= el.x + el.width && y >= el.y && y <= el.y + el.height
      })

      // Deselect all elements
      const updatedElements = elements.map((el) => ({ ...el, selected: false }))
      setElements(updatedElements)

      if (clickedElement) {
        // Select the clicked element
        const newElements = updatedElements.map((el) => (el.id === clickedElement.id ? { ...el, selected: true } : el))
        setElements(newElements)
        setSelectedElement({ ...clickedElement, selected: true })
      } else {
        setSelectedElement(null)
      }

      return
    }

    if (tool === "pencil") {
      const newElement: DrawingElement = {
        id: Date.now().toString(),
        type: "pencil",
        points: [{ x, y }],
        color,
        lineWidth: lineWidth[0],
      }

      setElements((prev) => [...prev, newElement])
      return
    }

    if (tool === "image" && selectedImage) {
      const newElement: DrawingElement = {
        id: Date.now().toString(),
        type: "image",
        x,
        y,
        width: 200,
        height: 200,
        color,
        lineWidth: lineWidth[0],
        imageUrl: selectedImage,
      }

      setElements((prev) => [...prev, newElement])
      setSelectedImage(null)
      return
    }
  }

  // Handle mouse move event
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current || !startPoint) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (tool === "select" && selectedElement) {
      // Move the selected element
      const dx = x - startPoint.x
      const dy = y - startPoint.y

      setStartPoint({ x, y })

      const newElements = elements.map((el) => {
        if (el.id !== selectedElement.id) return el

        if (el.type === "pencil" && el.points) {
          return {
            ...el,
            points: el.points.map((point) => ({
              x: point.x + dx,
              y: point.y + dy,
            })),
          }
        } else if (el.type === "line" && el.points) {
          return {
            ...el,
            points: [
              { x: el.points[0].x + dx, y: el.points[0].y + dy },
              { x: el.points[1].x + dx, y: el.points[1].y + dy },
            ],
          }
        } else {
          return {
            ...el,
            x: (el.x || 0) + dx,
            y: (el.y || 0) + dy,
          }
        }
      })

      setElements(newElements)
      return
    }

    if (tool === "pencil") {
      setElements((prevElements) => {
        const lastElement = { ...prevElements[prevElements.length - 1] }
        const newPoints = [...(lastElement.points || []), { x, y }]

        lastElement.points = newPoints

        return [...prevElements.slice(0, -1), lastElement]
      })
      return
    }

    if (tool === "rectangle" || tool === "circle") {
      setElements((prevElements) => {
        // If we're starting a new shape
        if (prevElements.length === 0 || prevElements[prevElements.length - 1].type !== tool || !isDrawing) {
          const newElement: DrawingElement = {
            id: Date.now().toString(),
            type: tool,
            x: startPoint.x,
            y: startPoint.y,
            width: x - startPoint.x,
            height: y - startPoint.y,
            color,
            lineWidth: lineWidth[0],
          }
          return [...prevElements, newElement]
        }

        // Update the last element
        const elementsCopy = [...prevElements]
        const lastElement = { ...elementsCopy[elementsCopy.length - 1] }

        lastElement.width = x - startPoint.x
        lastElement.height = y - startPoint.y

        return [...elementsCopy.slice(0, -1), lastElement]
      })
      return
    }

    if (tool === "line") {
      setElements((prevElements) => {
        // If we're starting a new line
        if (prevElements.length === 0 || prevElements[prevElements.length - 1].type !== "line" || !isDrawing) {
          const newElement: DrawingElement = {
            id: Date.now().toString(),
            type: "line",
            points: [
              { x: startPoint.x, y: startPoint.y },
              { x, y },
            ],
            color,
            lineWidth: lineWidth[0],
          }
          return [...prevElements, newElement]
        }

        // Update the last element
        const elementsCopy = [...prevElements]
        const lastElement = { ...elementsCopy[elementsCopy.length - 1] }

        if (lastElement.points && lastElement.points.length >= 2) {
          lastElement.points = [lastElement.points[0], { x, y }]
        }

        return [...elementsCopy.slice(0, -1), lastElement]
      })
    }
  }

  // Handle mouse up event
  const handleMouseUp = () => {
    setIsDrawing(false)
    setStartPoint(null)

    // Save the current state to history
    setHistory((prev) => [...prev, elements])
    setRedoStack([])
  }

  // Handle undo
  const handleUndo = () => {
    if (history.length === 0) return

    const previousState = history[history.length - 1]
    setRedoStack((prev) => [...prev, elements])
    setElements(previousState)
    setHistory((prev) => prev.slice(0, -1))
  }

  // Handle redo
  const handleRedo = () => {
    if (redoStack.length === 0) return

    const nextState = redoStack[redoStack.length - 1]
    setHistory((prev) => [...prev, elements])
    setElements(nextState)
    setRedoStack((prev) => prev.slice(0, -1))
  }

  // Handle clear canvas
  const handleClear = () => {
    setHistory((prev) => [...prev, elements])
    setElements([])
    setRedoStack([])
  }

  // Handle download canvas
  const handleDownload = () => {
    if (!canvasRef.current) return

    // Create a temporary canvas without the grid
    const tempCanvas = document.createElement("canvas")
    tempCanvas.width = canvasRef.current.width
    tempCanvas.height = canvasRef.current.height

    const tempCtx = tempCanvas.getContext("2d")
    if (!tempCtx) return

    // Fill with white background
    tempCtx.fillStyle = "white"
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)

    // Draw all elements
    drawElements(tempCtx, elements)

    // Create download link
    const link = document.createElement("a")
    link.download = "whiteboard.png"
    link.href = tempCanvas.toDataURL("image/png")
    link.click()
  }

  // Handle image upload
  const handleImageUpload = (imageUrl: string) => {
    setSelectedImage(imageUrl)
    setTool("image")
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between p-2 border-b bg-background">
        <div className="flex items-center space-x-2">
          <Button
            variant={tool === "select" ? "default" : "outline"}
            size="icon"
            onClick={() => setTool("select")}
            title="Select"
          >
            <Pencil className="h-4 w-4 rotate-45" />
          </Button>
          <Button
            variant={tool === "pencil" ? "default" : "outline"}
            size="icon"
            onClick={() => setTool("pencil")}
            title="Pencil"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant={tool === "line" ? "default" : "outline"}
            size="icon"
            onClick={() => setTool("line")}
            title="Line"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Button
            variant={tool === "rectangle" ? "default" : "outline"}
            size="icon"
            onClick={() => setTool("rectangle")}
            title="Rectangle"
          >
            <Square className="h-4 w-4" />
          </Button>
          <Button
            variant={tool === "circle" ? "default" : "outline"}
            size="icon"
            onClick={() => setTool("circle")}
            title="Circle"
          >
            <Circle className="h-4 w-4" />
          </Button>
          <ImageUploader onImageUpload={handleImageUpload}>
            <Button variant={tool === "image" ? "default" : "outline"} size="icon" title="Image">
              <ImageIcon className="h-4 w-4" />
            </Button>
          </ImageUploader>

          <div className="h-6 w-px bg-border mx-2" />

          <div className="flex items-center space-x-2">
            <ColorPicker color={color} onChange={setColor} />
            <div className="w-24">
              <Slider value={lineWidth} min={1} max={20} step={1} onValueChange={setLineWidth} />
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={handleUndo} disabled={history.length === 0} title="Undo">
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleRedo} disabled={redoStack.length === 0} title="Redo">
            <Redo2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleClear} title="Clear">
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleDownload} title="Download">
            <Download className="h-4 w-4" />
          </Button>

          <div className="h-6 w-px bg-border mx-2" />

          <Button variant="outline" size="sm" className="gap-2">
            <Users className="h-4 w-4" />
            <span>Collaboration (Coming Soon)</span>
          </Button>
        </div>
      </div>

      <div className="relative flex-grow overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>
    </div>
  )
}
