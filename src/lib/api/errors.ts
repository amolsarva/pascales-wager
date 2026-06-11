import { NextResponse } from 'next/server'

type ApiErrorOptions = {
  status?: number
  code?: string
}

type ClassifiedError = {
  status: number
  code: string
  message: string
}

export class AppError extends Error {
  status: number
  code: string

  constructor(message: string, options: ApiErrorOptions = {}) {
    super(message)
    this.name = 'AppError'
    this.status = options.status ?? 500
    this.code = options.code ?? 'app_error'
  }
}

export function isMissingTableWrite(error: { code?: string; message?: string } | null | undefined, table: string) {
  if (!error) return false
  const message = error.message?.toLowerCase() || ''
  return (
    error.code === 'PGRST205' &&
    message.includes(`'public.${table}'`) &&
    message.includes('schema cache')
  )
}

export function isMissingColumn(error: { code?: string; message?: string } | null | undefined, column: string) {
  if (!error) return false
  const message = error.message?.toLowerCase() || ''
  return message.includes(column.toLowerCase()) && (error.code === 'PGRST204' || error.code === '42703')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function getString(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function getNumber(value: unknown) {
  return typeof value === 'number' ? value : undefined
}

function classifyError(error: unknown, fallbackMessage: string): ClassifiedError {
  if (error instanceof AppError) {
    return {
      status: error.status,
      code: error.code,
      message: error.message,
    }
  }

  const record = isRecord(error) ? error : {}
  const message = error instanceof Error
    ? error.message
    : getString(record.message) || fallbackMessage
  const status = getNumber(record.status) ?? getNumber(record.statusCode)
  const errorCode = getString(record.code)
  const errorType = getString(record.type)
  const lowerMessage = message.toLowerCase()

  if (
    status === 429 ||
    errorCode === 'rate_limit_exceeded' ||
    errorType.includes('rate_limit') ||
    lowerMessage.includes('rate limit')
  ) {
    return {
      status: 429,
      code: 'openai_rate_limited',
      message: 'The AI provider is rate limited right now. Please wait a moment and try again.',
    }
  }

  if (
    errorType.startsWith('openai') ||
    getString(record.name).includes('API') ||
    lowerMessage.includes('openai') ||
    lowerMessage.includes('api key') ||
    lowerMessage.includes('model')
  ) {
    return {
      status: status && status >= 400 && status < 500 ? status : 503,
      code: 'openai_unavailable',
      message: 'The AI provider could not answer right now. Please try again in a moment.',
    }
  }

  if (
    errorCode ||
    getString(record.details) ||
    getString(record.hint) ||
    lowerMessage.includes('supabase') ||
    lowerMessage.includes('postgres') ||
    lowerMessage.includes('relation') ||
    lowerMessage.includes('violates')
  ) {
    return {
      status: 503,
      code: 'database_error',
      message: 'The private record could not be saved or loaded right now. Please try again.',
    }
  }

  return {
    status: status && status >= 400 && status < 600 ? status : 500,
    code: 'internal_error',
    message: fallbackMessage,
  }
}

export function apiErrorResponse(error: unknown, fallbackMessage: string) {
  const classified = classifyError(error, fallbackMessage)
  return NextResponse.json(
    {
      error: classified.message,
      code: classified.code,
    },
    { status: classified.status }
  )
}
