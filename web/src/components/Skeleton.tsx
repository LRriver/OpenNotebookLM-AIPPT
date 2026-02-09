import { ReactNode } from 'react'

interface SkeletonProps {
  className?: string
  children?: ReactNode
}

/**
 * 骨架屏基础组件
 * 用于显示加载状态的占位符
 */
function Skeleton({ className = '', children }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded ${className}`}
      data-testid="skeleton"
    >
      {children}
    </div>
  )
}

/**
 * 幻灯片卡片骨架屏
 */
function SlideCardSkeleton() {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* 图片区域骨架 */}
      <div className="relative bg-gray-100 aspect-video">
        <Skeleton className="w-full h-full" />
        {/* 页码标签骨架 */}
        <div className="absolute top-2 left-2">
          <Skeleton className="w-16 h-5" />
        </div>
      </div>
      {/* 描述区域骨架 */}
      <div className="p-3 bg-white">
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  )
}

/**
 * 幻灯片列表骨架屏
 */
function SlideListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4 p-4">
      {Array.from({ length: count }).map((_, index) => (
        <SlideCardSkeleton key={index} />
      ))}
    </div>
  )
}

/**
 * 表单骨架屏
 */
function FormSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {/* 标题骨架 */}
      <Skeleton className="h-6 w-1/3" />
      
      {/* 输入框骨架 */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-10 w-full" />
      </div>
      
      <div className="space-y-2">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-10 w-full" />
      </div>
      
      {/* 按钮骨架 */}
      <Skeleton className="h-10 w-24" />
    </div>
  )
}

/**
 * 文件预览骨架屏
 */
function FilePreviewSkeleton() {
  return (
    <div className="p-4 space-y-3">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  )
}

export {
  Skeleton,
  SlideCardSkeleton,
  SlideListSkeleton,
  FormSkeleton,
  FilePreviewSkeleton
}

export default Skeleton
