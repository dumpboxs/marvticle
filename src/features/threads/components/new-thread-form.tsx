import { useForm } from '@tanstack/react-form-start'
import { ClientOnly } from '@tanstack/react-router'

import BlockNoteEditor from '#/components/block-note/editor'
import { Button } from '#/components/ui/button'
import { Field, FieldGroup } from '#/components/ui/field'
import { Spinner } from '#/components/ui/spinner'
import { Textarea } from '#/components/ui/textarea'
import { useCreateThreadMutation } from '#/features/threads/hooks/use-threads'
import { threadInsertSchema } from '#/features/threads/schemas/thread.schema'

export const NewThreadForm = () => {
  const createThreadMutation = useCreateThreadMutation()

  const form = useForm({
    validators: {
      onChange: threadInsertSchema,
      onSubmit: threadInsertSchema,
    },
    defaultValues: {
      title: '',
      content: '',
    },
    onSubmit: async ({ value }) => {
      await createThreadMutation.mutateAsync(value)
    },
  })

  return (
    <form
      id="new-thread-form"
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        void form.handleSubmit()
      }}
    >
      <FieldGroup className="gap-4">
        <form.Field
          name="title"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <Textarea
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                      e.preventDefault()
                    }
                  }}
                  aria-invalid={isInvalid}
                  placeholder="What's on your mind?"
                  autoComplete="off"
                  rows={1}
                  onInput={(e) => {
                    const el = e.currentTarget
                    el.style.height = 'auto'
                    el.style.height = `${el.scrollHeight}px`
                  }}
                  className="field-sizing-content! min-h-0! resize-none overflow-hidden border-none bg-transparent! px-0 font-heading text-3xl! font-semibold tracking-tight shadow-none ring-0!"
                />
              </Field>
            )
          }}
        />

        <form.Field
          name="content"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <ClientOnly>
                  <BlockNoteEditor
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e)}
                  />
                </ClientOnly>
              </Field>
            )
          }}
        />
      </FieldGroup>

      <div className="flex items-center justify-end gap-2">
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
          children={([canSubmit, isSubmitting]) => (
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? <Spinner /> : 'Post Thread'}
            </Button>
          )}
        />
      </div>
    </form>
  )
}
