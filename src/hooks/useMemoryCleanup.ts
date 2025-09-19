import { useEffect } from 'react';
import { URLManager } from '@/lib/url-manager';

/**
 * 全局内存清理Hook
 * 在组件卸载时清理所有资源
 */
export function useMemoryCleanup() {
  useEffect(() => {
    // 组件挂载时的设置（如果需要）

    // 组件卸载时的清理
    return () => {
      // 清理所有未释放的Object URLs
      URLManager.revokeAllURLs();
    };
  }, []);

  // 监听页面卸载事件
  useEffect(() => {
    const handleBeforeUnload = () => {
      URLManager.revokeAllURLs();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // 当页面不可见时可以进行额外的内存清理
        // 目前暂时留空，后续可以根据需要添加清理逻辑
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
}
