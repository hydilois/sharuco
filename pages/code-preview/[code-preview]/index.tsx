"use client"

import Head from "next/head"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useDocument } from "@/firebase/firestore/getDocument"
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry"

import CardCode from "@/components/card-code"
import Error from "@/components/error"
import { Layout } from "@/components/layout"
import Loader from "@/components/loader"
import { buttonVariants } from "@/components/ui/button"
import "prism-themes/themes/prism-one-dark.min.css"

export default function CodePreview() {
  const searchParams = useSearchParams()

  const { data, isLoading, isError } = useDocument(
    searchParams.get("code-preview"),
    "codes"
  )

  return (
    <Layout>
      <Head>
        <title>Sharuco</title>
        <meta
          name="description"
          content="Sharuco allows you to share code snippets that you have found
                 useful."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <section className="container grid items-center gap-6 pt-6 pb-8 md:py-10">
        
        {isLoading && <Loader />}
        {data && data.exists && (
          <ResponsiveMasonry
            columnsCountBreakPoints={{
              all: 1,
            }}
          >
            <Masonry>
              <CardCode
                key={data.data.id}
                id={data.data.id}
                idAuthor={data.data.idAuthor}
                language={data.data.language}
                code={data.data.code}
                description={data.data.description}
                tags={data.data.tags}
                favoris={data.data.favoris}
              />
            </Masonry>
          </ResponsiveMasonry>
        )}
        {data && !data.exists && (
          <div className="flex flex-col items-center gap-4">
            <h1 className="tesxt-4xl font-bold">
              This code snippet does not exist.
            </h1>
            <Link
              href="/explore"
              className={buttonVariants({ size: "lg", variant: "outline" })}
            >
              Explore code
            </Link>
          </div>
        )}
        {isError && <Error />}
      </section>
    </Layout>
  )
}
