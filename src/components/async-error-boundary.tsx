'use client';

import type { ComponentType, ReactNode } from 'react';
import React, { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { ComponentErrorBoundary } from './error-boundary';

interface AsyncComponentProps {
  fallback?: ReactNode;
  errorFallback?: ReactNode;
  children: ReactNode;
}

/**
 * 异步组件错误边界 - 专门处理异步操作中的错误
 */
export function AsyncErrorBoundary({ errorFallback, children }: AsyncComponentProps) {
  return (
    <ComponentErrorBoundary
      fallback={
        errorFallback || (
          <div className="p-4">
            <div className="text-center text-destructive">
              <p>加载失败，请重试</p>
            </div>
          </div>
        )
      }
    >
      {children}
    </ComponentErrorBoundary>
  );
}

/**
 * 高阶组件 - 为组件添加错误边界
 */
export function withErrorBoundary<P extends object>(
  Component: ComponentType<P>,
  fallback?: ReactNode
): ComponentType<P> {
  return function WithErrorBoundary(props: P) {
    return (
      <ComponentErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ComponentErrorBoundary>
    );
  };
}

/**
 * 异步加载组件的错误边界包装器
 */
export function withAsyncErrorBoundary<T extends Promise<unknown>>(
  asyncFn: () => T,
  options: {
    fallback?: ReactNode;
    errorFallback?: ReactNode;
    onError?: (error: Error) => void;
  } = {}
) {
  return {
    component: function AsyncComponent() {
      return (
        <ComponentErrorBoundary fallback={options.errorFallback}>
          <Suspense fallback={options.fallback || <AsyncLoadingSkeleton />}>
            <AsyncComponentWrapper asyncFn={asyncFn} />
          </Suspense>
        </ComponentErrorBoundary>
      );
    },
    promise: asyncFn(),
  };
}

/**
 * 异步组件包装器
 */
function AsyncComponentWrapper<T extends Promise<unknown>>({ asyncFn }: { asyncFn: () => T }) {
  return React.createElement(
    React.lazy(() =>
      asyncFn().then((result) => ({
        default: () => React.createElement('div', {}, JSON.stringify(result)),
      }))
    )
  );
}

/**
 * 骨架屏加载组件
 */
export function AsyncLoadingSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-[80%]" />
      <Skeleton className="h-4 w-[60%]" />
    </div>
  );
}
