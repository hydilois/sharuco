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
import indentCode from "@/utils/indentCode.js"
import linearizeCode from "@/utils/linearizeCode"
import { yupResolver } from "@hookform/resolvers/yup"
import sdk, { Project } from "@stackblitz/sdk"
import algoliasearch from "algoliasearch"
import { data } from "cheerio/lib/api/attributes.js"
import hljs from "highlight.js"
import {
  Calendar,
  Check,
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
  Trash,
  Type,
  User,
  View,
  X,
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

export default function SettingsForms({ dataForm }: { dataForm: any }) {
  const searchParams = useSearchParams()
  const { user, userPseudo } = useAuthContext()
  const router = useRouter()

  const { toast } = useToast()

  const notifyUrlCopied = () =>
    toast({
      title: "Url of your code copied to clipboard",
      description: "You can share it wherever you want",
      action: <ToastAction altText="Okay">Okay</ToastAction>,
    })

  const ALGOLIA_INDEX_NAME = "forms"

  const client = algoliasearch(
    process.env.NEXT_PUBLIC_ALGOLIA_APP_ID,
    process.env.NEXT_PUBLIC_ALGOLIA_ADMIN_KEY
  )
  const index = client.initIndex(ALGOLIA_INDEX_NAME)

  const schema = yup.object().shape({
    name: yup.string().required("Name is required"),
    description: yup.string().required("Description is required"),
    color: yup
      .string()
      .matches(
        /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
        'Color must be a valid hex color code starting with "#"'
      )
      .required("Color is required"),
    redirectOnCompletion: yup
      .string()
      .url("Redirect URL must be a valid URL")
      .nullable(),
    // publicNotchPayApiKey: yup
    //   .string()
    //   .matches(/^b\./, 'Public NotchPay API key must start with "b."')
    //   .required("Public NotchPay API key is required"),
    //amountNotchPay: yup.number().required('Amount for NotchPay is required'),
  })

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  })

  useEffect(() => {
    setValue("name", dataForm.name)
    setValue("description", dataForm.description)
    setValue("color", dataForm.color)
    setValue("redirectOnCompletion", dataForm.redirectOnCompletion)
    // setValue("publicNotchPayApiKey", dataForm.publicNotchPayApiKey)
    // setValue("amountNotchPay", dataForm.amountNotchPay)
  }, [dataForm])

  const {
    updateFormDocument,
    isLoading: isLoadingUpdateForm,
    isError: isErrorUpdateForm,
    isSuccess: isSuccessUpdateForm,
    reset: resetUpdateForm,
  }: any = useUpdateFormDocument("forms")

  const onSubmit = async (data) => {
    const {
      name: nameUpdate,
      description: descriptionUpdate,
      color: colorUpdate,
      redirectOnCompletion: redirectOnCompletionUpdate,
      // publicNotchPayApiKey: publicNotchPayApiKeyUpdate,
      // amountNotchPay: amountNotchPayUpdate,
    } = data

    if (
      nameUpdate === dataForm.name &&
      descriptionUpdate === dataForm.description &&
      colorUpdate === dataForm.color &&
      redirectOnCompletionUpdate === dataForm.redirectOnCompletion
      // && publicNotchPayApiKeyUpdate === dataForm.publicNotchPayApiKey &&
      // amountNotchPayUpdate === dataForm.amountNotchPay
    ) {
      toast({
        variant: "destructive",
        title: "You have not made any changes",
        description: "Please make changes to update your settings",
        action: <ToastAction altText="Okay">Okay</ToastAction>,
      })
      return
    }

    let updatedFormData: {
      name: string
      description: string
      color: string
      redirectOnCompletion: string
      // publicNotchPayApiKey: string
      // amountNotchPay: number
    } = {
      name: nameUpdate,
      description: descriptionUpdate,
      color: colorUpdate,
      redirectOnCompletion: redirectOnCompletionUpdate,
      // publicNotchPayApiKey: publicNotchPayApiKeyUpdate,
      // amountNotchPay: amountNotchPayUpdate,
    }

    const id = searchParams.get("form")

    await updateFormDocument({ id, updatedFormData })

    await index.partialUpdateObject({
      objectID: id,
      name: nameUpdate,
      description: descriptionUpdate,
      color: colorUpdate,
      redirectOnCompletion: redirectOnCompletionUpdate,
      // publicNotchPayApiKey: publicNotchPayApiKeyUpdate,
      // amountNotchPay: amountNotchPayUpdate,
    })

    reset({
      name: nameUpdate,
      description: descriptionUpdate,
      color: colorUpdate,
      redirectOnCompletion: redirectOnCompletionUpdate,
      // publicNotchPayApiKey: publicNotchPayApiKeyUpdate,
      // amountNotchPay: amountNotchPayUpdate,
    })
  }

  return (
    <div className="flex py-12 shrink-0 items-center justify-center rounded-md border border-dashed border-slate-300 dark:border-slate-700">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-start justify-center gap-4 p-4 text-center">
        <div className="flex flex-col items-start">
          <h3 className="text-xl font-semibold">General</h3>
        </div>
        <Separator className="opacity-50" />
        <div className="flex w-full flex-col items-start gap-2">
          <Label>Name</Label>
          <Input
            placeholder="Name of the form"
            {...register("name")}
            defaultValue={dataForm.name}
          />
          <p className="text-sm text-red-500">
            {errors.name && <>{errors.name.message}</>}
          </p>
        </div>
        <div className="flex w-full flex-col items-start gap-2">
          <Label>Description</Label>
          <Input
            placeholder="Description of the form"
            {...register("description")}
            // defaultValue={dataForm.description}
          />
          <p className="text-sm text-red-500">
            {errors.description && <>{errors.description.message}</>}
          </p>
        </div>

        <div className="flex w-full flex-col items-start gap-2">
          <Label>Color of the form</Label>
          <div className="w-full flex items-center gap-2">
            <Input
              className="w-full"
              placeholder="#000000"
              {...register("color")}
              // defaultValue={dataForm.color}
            />
            <div
              className="block w-9 h-9 rounded-md"
              style={{
                background: `${dataForm.color}`,
              }}
            ></div>
          </div>
          <p className="text-sm text-red-500">
            {errors.color && <>{errors.color.message}</>}
          </p>
        </div>
        <div className="flex w-full flex-col items-start gap-2">
          <div className="flex w-full flex-col items-start gap-1">
            <Label>Redirect to this URL when the form is submitted.</Label>
            <p className="text-sm text-left">
              Leave the field blank if you do not want to redirect to a URL
            </p>
          </div>
          <Input
            placeholder="https://example.com?success=true"
            {...register("redirectOnCompletion")}
            // defaultValue={dataForm.redirectOnCompletion}
          />
          <p className="text-sm text-red-500">
            {errors.redirectOnCompletion && (
              <>{errors.redirectOnCompletion.message}</>
            )}
          </p>
        </div>
        <div className="relative flex flex-col items-start gap-4 opacity-30 w-full before:absolute before:inset-0">
          {/* <Separator className="my-2" /> */}
          <div className="flex flex-col items-start">
            <h3 className="text-xl font-semibold">Payment</h3>
            <p className="text-sm text-left">
              You can use{" "}
              <a
                href="https://business.notchpay.co"
                className="font-bold underline underline-offset-4"
              >
                NotchPay
              </a>{" "}
              to accept payments on your form. You can create a NotchPay account{" "}
              <a
                href="https://business.notchpay.co"
                className="font-bold underline underline-offset-4"
              >
                here
              </a>
              .
            </p>
          </div>
          {/* <Separator className="opacity-50" /> */}
          <div className="flex w-full flex-col items-start gap-2">
            <div className="flex w-full flex-col items-start gap-1">
              <Label>Public NotchPay API key</Label>
              <p className="text-sm text-left">
                You can have it here :{" "}
                <a
                  href="https://business.notchpay.co/settings/developer"
                  className="font-semibold underline underline-offset-4"
                >
                  https://business.notchpay.co/settings/developer
                </a>
              </p>
            </div>
            <Input
              placeholder="b.nxxxxxxxxxxxxxxx"
              //{...register("publicNotchPayApiKey")}
            />
            {/* <p className="text-sm text-red-500">
                      {errors.publicNotchPayApiKey && <>{errors.publicNotchPayApiKey.message}</>}
                    </p> */}
          </div>
          <div className="flex w-full flex-col items-start gap-2">
            <Label>Amount ( in XAF ) </Label>
            <Input
              placeholder="5000 XAF"
              //{...register("amountNotchPay")}
            />
            {/* <p className="text-sm text-red-500">
                      {errors.amountNotchPay && <>{errors.amountNotchPay.message}</>}
                    </p> */}
          </div>
        </div>
        <div className="sticky bottom-0 w-full left-0 right-0 flex flex-col items-start gap-2  py-4 border-t bg-white dark:bg-slate-900">
          <Button
            variant="default"
            disabled={isLoadingUpdateForm}
            onClick={isLoadingUpdateForm ? undefined : handleSubmit(onSubmit)}
          >
            {isLoadingUpdateForm ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save changes
          </Button>
          {isSuccessUpdateForm && (
            <div
              className="flex w-full items-center rounded-lg bg-green-50 p-4 text-green-800 dark:bg-gray-800 dark:text-green-400"
              role="alert"
            >
              <Check className="h-4 w-4" />
              <span className="sr-only">Info</span>
              <div className="ml-3 text-sm font-medium">
                Your settings have been updated !
              </div>
              <button
                type="button"
                className="-m-1.5 ml-auto inline-flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 p-1.5 text-green-500 hover:bg-green-200 focus:ring-2 focus:ring-green-400 dark:bg-gray-800 dark:text-green-400 dark:hover:bg-gray-700"
                onClick={resetUpdateForm}
              >
                <span className="sr-only">Close</span>
                <X />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
