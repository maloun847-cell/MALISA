import { startTransition, type FormEvent } from "react";

/**
 * React resets a <form action={…}> after every submission, which wipes what
 * the user typed when validation fails. Submitting through onSubmit keeps the
 * fields intact while still dispatching to the server action.
 */
export function keepValues(dispatch: (form: FormData) => void) {
  return (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    startTransition(() => dispatch(form));
  };
}
