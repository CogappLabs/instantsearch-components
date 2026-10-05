import type { IndexUiState } from "instantsearch.js";

/** A card, which either starts a search or links out, never neither. */
export type StartingPoint = {
  title: string;
  text?: string;
  image?: { src: string; alt?: string };
  /** Records the card's search finds, from the consumer's own query. */
  count?: number;
} & (
  | {
      /** The search it starts, in routing's UI-state shape. */
      state: IndexUiState;
      href?: never;
    }
  | {
      /** A link out instead of a search, such as a curated page. */
      href: string;
      state?: never;
    }
);

/**
 * Classes added beside the component's own, so the cards can match a
 * theme's. The component's own look for each is under `:where()`.
 */
export interface StartingPointsClassNames {
  root: string;
  heading: string;
  list: string;
  item: string;
  card: string;
  image: string;
  title: string;
  text: string;
  count: string;
}

export interface StartingPointsProps {
  items: StartingPoint[];
  /** Above the cards, such as "Start exploring". None by default. */
  heading?: string;
  /** A card's count, words and all, as "1,204 records". */
  formatCount?: (count: number) => string;
  classNames?: Partial<StartingPointsClassNames>;
  /** Added to the root, beside `starting-points`, to theme one instance. */
  className?: string;
}

/** A fixed locale, so server and client render the same digits. */
const englishCount = new Intl.NumberFormat("en");

const records = (n: number) => `${englishCount.format(n)} ${n === 1 ? "record" : "records"}`;

const withClass = (own: string, ...extra: (string | undefined)[]) =>
  [own, ...extra].filter(Boolean).join(" ");

/**
 * Suggested searches as cards. The view alone: `StartingPoints` shows it
 * from React InstantSearch while nothing is searched or refined, and
 * `startingPoints` does the same from InstantSearch.js.
 */
export const StartingPointsView = ({
  items,
  heading,
  formatCount = records,
  classNames = {},
  className,
  onChoose,
}: StartingPointsProps & { onChoose: (state: IndexUiState) => void }) => {
  if (!items.length) return null;
  return (
    <section className={withClass("starting-points", className, classNames.root)}>
      {heading ? (
        <h2 className={withClass("starting-points-heading", classNames.heading)}>{heading}</h2>
      ) : null}
      <ul className={withClass("starting-points-list", classNames.list)}>
        {items.map((item, i) => {
          const body = (
            <>
              {item.image ? (
                <img
                  className={withClass("starting-points-image", classNames.image)}
                  src={item.image.src}
                  alt={item.image.alt ?? ""}
                  loading="lazy"
                />
              ) : null}
              <span className={withClass("starting-points-title", classNames.title)}>
                {item.title}
              </span>
              {item.text ? (
                <span className={withClass("starting-points-text", classNames.text)}>
                  {item.text}
                </span>
              ) : null}
              {item.count !== undefined ? (
                <span className={withClass("starting-points-count", classNames.count)}>
                  {formatCount(item.count)}
                </span>
              ) : null}
            </>
          );
          const card = withClass("starting-points-card", classNames.card);
          return (
            <li
              // biome-ignore lint/suspicious/noArrayIndexKey: cards have no id, and titles may repeat
              key={`${i}:${item.title}`}
              className={withClass("starting-points-item", classNames.item)}
            >
              {item.href !== undefined ? (
                <a className={card} href={item.href}>
                  {body}
                </a>
              ) : (
                <button type="button" className={card} onClick={() => onChoose(item.state)}>
                  {body}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
};
