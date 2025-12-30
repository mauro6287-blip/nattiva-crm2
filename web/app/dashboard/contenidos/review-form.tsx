'use client'

import { useActionState } from "react"
import { reviewContent } from "./actions"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"

const initialState: any = {
    error: '',
    success: false
}

export function ReviewForm({ contentId }: { contentId: string }) {
    const [state, formAction, isPending] = useActionState(reviewContent, initialState)

    return (
        <form action={formAction} className="flex justify-end gap-2 items-center">
            <input type="hidden" name="content_id" value={contentId} />

            {state?.error && <span className="text-xs text-red-500 mr-2">{state.error}</span>}

            <Button
                size="sm"
                variant="outline"
                name="decision"
                value="reject"
                className="text-red-600 hover:text-red-700"
                disabled={isPending}
            >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4 mr-1" />}
                Rechazar
            </Button>

            <Button
                size="sm"
                name="decision"
                value="approve"
                className="bg-green-600 hover:bg-green-700"
                disabled={isPending}
            >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-1" />}
                Publicar
            </Button>
        </form>
    )
}
