"use client"

import { useEffect, useState } from "react"
import Head from "next/head"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  allLanguages,
  getExtensionByName,
  languagesName,
} from "@/constants/languages"
import { useAuthContext } from "@/context/AuthContext"
import { useGitHubLogout } from "@/firebase/auth/githubLogout"
import { useCreateDocument } from "@/firebase/firestore/createDocument"
import { useDocument } from "@/firebase/firestore/getDocument"
import { useGetDocumentFromUser } from "@/firebase/firestore/getDocumentFromUser"
import { useGetFavoriteCode } from "@/firebase/firestore/getFavoriteCode"
import { useGetIsPrivateCodeFromUser } from "@/firebase/firestore/getIsPrivateCodeFromUser"
import { useUpdateFormDocument } from "@/firebase/firestore/updateFormDocument"
import copyToClipboard from "@/utils/copyToClipboard.js"
import embedProject from "@/utils/embedStackblitzProject"
import formatDateTime from "@/utils/formatDateTime.js"
import indentCode from "@/utils/indentCode.js"
import linearizeCode from "@/utils/linearizeCode"
import { yupResolver } from "@hookform/resolvers/yup"
import sdk, { Project } from "@stackblitz/sdk"
import algoliasearch from "algoliasearch"
import hljs from "highlight.js"
import {
  Calendar,
  CircleDot,
  Eye,
  EyeOff,
  FileCog,
  FileQuestion,
  Heart,
  LinkIcon,
  List,
  ListChecks,
  Loader2,
  MessageSquare,
  Plus,
  Save,
  Send,
  Settings,
  Timer,
  Trash,
  Type,
  User,
  View,
} from "lucide-react"
import moment from "moment"
import { useFieldArray, useForm } from "react-hook-form"
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry"
import * as yup from "yup"

import { TemplateName } from "@/types/templatStackblitzName"
import { cn } from "@/lib/utils"
import CardCode from "@/components/cards/card-code"
import CardCodeAdmin from "@/components/cards/card-code-admin"
import EmptyCard from "@/components/empty-card"
import Error from "@/components/error"
import { Layout } from "@/components/layout"
import LoaderCodes from "@/components/loaders/loader-codes"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { ToastAction } from "@/components/ui/toast"
import { useToast } from "@/components/ui/use-toast"

export default function ResponsesForms({ dataForm }: { dataForm: any }) {
  const searchParams = useSearchParams()
  const { user } = useAuthContext()
  const router = useRouter()

  const { toast } = useToast()

  const notifyUrlCopied = () =>
    toast({
      title: "Url of your code copied to clipboard",
      description: "You can share it wherever you want",
      action: <ToastAction altText="Okay">Okay</ToastAction>,
    })

  const pseudo = user?.reloadUserInfo.screenName.toLowerCase()

  const ALGOLIA_INDEX_NAME = "forms"

  const client = algoliasearch(
    process.env.NEXT_PUBLIC_ALGOLIA_APP_ID,
    process.env.NEXT_PUBLIC_ALGOLIA_ADMIN_KEY
  )
  const index = client.initIndex(ALGOLIA_INDEX_NAME)

  // console.log(dataForm.responses)

  const { updateFormDocument, isLoading: isLoadingUpdateForm }: any =
    useUpdateFormDocument("forms")

  const handleDeleteResponse = async (idResponse: string) => {
    let updatedFormData: {
      responses: any[]
    } = {
      responses: [
        ...dataForm.responses.filter(
          (response: any) => response.idResponse !== idResponse
        ),
      ],
    }

    const id = searchParams.get("form")

    //console.log(updatedFormData.responses,)

    await updateFormDocument({ id, updatedFormData })

    await index.partialUpdateObject({
      objectID: id,
      responses: updatedFormData.responses,
    })

    //console.log("updatedFormData", updatedFormData)
  }

  return (
    <>
      {dataForm.responses && dataForm.responses.length > 0 ? (
        <div className="w-full space-y-4">
          {dataForm.responses
            .slice()
            .reverse()
            .map((response, index) => (
              <div
                className="w-full flex flex-col items-start gap-5 p-4 rounded-md border border-dashed border-slate-300 dark:border-slate-700"
                key={index}
              >
                <div className="w-full flex flex-col items-start gap-2 ">
                  {response.responses.map((answer, answerIndex) => (
                    <div
                      className="w-full flex flex-col items-start gap-2 rounded-md bg-slate-100 dark:bg-slate-800 p-4"
                      key={answerIndex}
                    >
                      {/* {answer.type} */}
                      <Label>{answer.label}</Label>
                      <div>
                        <p className="font-semibold">{answer.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="w-full flex items-center justify-between">
                  <span className="flex items-center gap-1 text-slate-700 dark:text-slate-400">
                    <Timer className="mr-1.5 h-4 w-4" />
                    <span className="text-sm font-medium">
                      {formatDateTime(moment(response.createdAt))}
                    </span>
                  </span>
                  <Button
                    variant="destructive"
                    className="flex items-center justify-center rounded-md p-2 gap-2 text-semibold"
                    disabled={isLoadingUpdateForm}
                    onClick={() => {
                      isLoadingUpdateForm
                        ? undefined
                        : handleDeleteResponse(response.idResponse)
                    }}
                  >
                    {isLoadingUpdateForm ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash className="h-4 w-4" />
                    )}
                    Delete
                  </Button>
                </div>
              </div>
            ))}
        </div>
      ) : (
        <EmptyCard
          icon={<MessageSquare className="h-8 w-8" />}
          title="No responses yet"
          description="Responses to your form will appear here"
        />
      )}
    </>
  )
}
