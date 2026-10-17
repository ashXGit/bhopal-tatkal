export function RedditUpvoteIcon({
  filled = false,
  className = "w-5 h-5",
}: {
  filled?: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      {filled ? (
        <path d="M10 2.5a.75.75 0 0 1 .53.22l6.25 6.25a.75.75 0 0 1-.53 1.28H13v6.75a.75.75 0 0 1-.75.75h-4.5a.75.75 0 0 1-.75-.75V10.25H3.75a.75.75 0 0 1-.53-1.28l6.25-6.25a.75.75 0 0 1 .53-.22Z" />
      ) : (
        <path d="M10 2.5a.75.75 0 0 1 .53.22l6.25 6.25a.75.75 0 0 1-.53 1.28H13v6.75a.75.75 0 0 1-.75.75h-4.5a.75.75 0 0 1-.75-.75V10.25H3.75a.75.75 0 0 1-.53-1.28l6.25-6.25a.75.75 0 0 1 .53-.22Zm0 1.81L4.81 9.5H7.5a.75.75 0 0 1 .75.75v6.5h3.5v-6.5a.75.75 0 0 1 .75-.75h2.69L10 4.31Z" />
      )}
    </svg>
  );
}

export function RedditDownvoteIcon({
  filled = false,
  className = "w-5 h-5",
}: {
  filled?: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      {filled ? (
        <path d="M10 17.5a.75.75 0 0 1-.53-.22L3.22 11.03a.75.75 0 0 1 .53-1.28H7V3a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 .75.75v6.75h3.25a.75.75 0 0 1 .53 1.28l-6.25 6.25a.75.75 0 0 1-.53.22Z" />
      ) : (
        <path d="M10 17.5a.75.75 0 0 1-.53-.22L3.22 11.03a.75.75 0 0 1 .53-1.28H7V3a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 .75.75v6.75h3.25a.75.75 0 0 1 .53 1.28l-6.25 6.25a.75.75 0 0 1-.53.22Zm0-1.81l5.19-5.19H12.5a.75.75 0 0 1-.75-.75V3.25h-3.5v6.5a.75.75 0 0 1-.75.75H4.81L10 15.69Z" />
      )}
    </svg>
  );
}
