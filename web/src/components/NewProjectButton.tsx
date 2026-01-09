/**
 * NewProjectButton 组件 - 新建项目按钮
 * 
 * Requirements: 10.3
 * 
 * 清除当前状态和 localStorage 中的项目数据
 */

import { useState, useCallback } from 'react'
import { StorageService } from '../services/storageService'
import ConfirmDialog from './ConfirmDialog'

interface NewProjectButtonProps {
  hasUnsavedChanges: boolean
  onNewProject: () => void
  className?: string
}

/**
 * 新建项目按钮组件
 */
export function NewProjectButton({
  hasUnsavedChanges,
  onNewProject,
  className = ''
}: NewProjectButtonProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  /**
   * 处理点击新建项目
   */
  const handleClick = useCallback(() => {
    if (hasUnsavedChanges) {
      // 有未保存的更改，显示确认对话框
      setShowConfirmDialog(true)
    } else {
      // 没有未保存的更改，直接新建
      handleConfirmNewProject()
    }
  }, [hasUnsavedChanges])

  /**
   * 确认新建项目
   */
  const handleConfirmNewProject = useCallback(() => {
    // 清除 localStorage 中的项目数据
    StorageService.clearProject()
    
    // 调用回调重置应用状态
    onNewProject()
    
    // 关闭对话框
    setShowConfirmDialog(false)
  }, [onNewProject])

  /**
   * 取消新建项目
   */
  const handleCancelNewProject = useCallback(() => {
    setShowConfirmDialog(false)
  }, [])

  return (
    <>
      <button
        onClick={handleClick}
        className={`
          inline-flex items-center gap-2 px-4 py-2
          text-sm font-medium text-gray-700
          bg-white border border-gray-300 rounded-lg
          hover:bg-gray-50 hover:border-gray-400
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          transition-colors duration-200
          ${className}
        `}
        title="新建项目"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
        新建项目
      </button>

      {/* 确认对话框 */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        title="新建项目？"
        message="当前项目有未保存的更改。新建项目将清除所有当前内容，此操作无法撤销。"
        confirmText="新建项目"
        cancelText="取消"
        confirmVariant="danger"
        onConfirm={handleConfirmNewProject}
        onCancel={handleCancelNewProject}
      />
    </>
  )
}

export default NewProjectButton
