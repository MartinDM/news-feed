'use client'

import React, { useEffect, useRef, useState } from 'react'
import debounce from 'lodash.debounce'
import SelectedTags from './SelectedTags'
import { useAtom, atom } from 'jotai'
import { selectionsAtom } from '../state'
import useSearch from '../hooks/useSearch'

export type TSubscription = {
  display_name: string
  community_icon: string
  display_name_prefixed: string
  id: string
  url: string
}

const Search = () => {
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [searchResults, setSearchResults] = useState<TSubscription[]>(null)
  const [selections, setSelections] = useAtom(selectionsAtom)

  const searchInput = useRef(null)

  const fetchResults = async () => {
    if (!searchTerm.length) return
    await fetch(
      `https://www.reddit.com/subreddits/search.json?q=${searchTerm}&limit=10`
    )
      .then((response) => {
        return response.json()
      })
      .then((data) => {
        const results: TSubscription[] = data.data.children.map((item) => {
          const {
            display_name,
            display_name_prefixed,
            url,
            id,
          }: TSubscription = item.data
          const community_icon =
            item.data.community_icon.split('?')[0] ||
            'https://picsum.photos/200'
          return {
            display_name,
            display_name_prefixed,
            url,
            id,
            community_icon,
          }
        })
        setSearchResults(results)
      })
      .catch((err) => {
        console.error(err)
      })
  }

  const delayedQuery = debounce(fetchResults, 400)

  useEffect(() => {
    const inputRef = searchInput.current
    console.log('searchTerm changed')
    if (searchTerm.length === 0) {
      setSearchResults(null)
    }
    delayedQuery()
    return () => {
      delayedQuery.cancel
      inputRef?.focus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm])

  const handleClearSearch = () => {
    setSearchTerm('')
    setSearchResults([])
    searchInput.current.focus()
  }

  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
  }

  const handleResultSelect = (result: TSubscription) => {
    const newSelection: TSubscription = (({
      id,
      display_name_prefixed,
      display_name,
      community_icon,
      url,
    }) => ({
      id,
      display_name_prefixed,
      display_name,
      community_icon,
      url,
    }))(result)
    setSelections([...selections, newSelection])
    setSearchTerm('')
    setSearchResults([])
  }

  const ResultsList: React.FC = () => {
    if (searchResults.length === 0) return
    return (
      <>
        <ul className="block absolute top-[78px] w-80 left-[155px] w-md max-h-[64vh] overflow-scroll text-slate-400 bg-slate-200 rounded-lg">
          {searchResults.map((result) => (
            <li
              className="flex py-3 px-2 items-center text-sm overflow-hidden hover:text-cyan-500 text-ellipsis border-b border-b-zinc-300 hover:bg-slate-300 hover:cursor-pointer"
              key={result.id}
              onClick={() => handleResultSelect(result)}
            >
              <img
                src={result.community_icon || 'https://picsum.photos/200'}
                alt={result.display_name}
                className="h-[58px] w-[58px] rounded-full object-cover mr-3 border-[1px] border-cyan-500 "
              />
              {result.display_name_prefixed}
            </li>
          ))}
        </ul>
        {!!searchResults.length && (
          <button
            onClick={() => handleClearSearch()}
            className="flex text-zinc-500 text-m text-bold hover:text-zinc-700 p-2"
          >
            <svg
              className="w-6 mr-3"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
            Clear search
          </button>
        )}
      </>
    )
  }

  return (
    <>
      <input
        ref={searchInput}
        type="text"
        id="search"
        onChange={handleSearch}
        className="p-4 text-slate-600 outline-none border-2 border-b-cyan-500 rounded-md block min-w-[200px] bg-slate-200"
        placeholder="Start typing..."
        value={searchTerm}
      />
      {searchResults && <ResultsList />}
      <SelectedTags searchInputRef={searchInput} />
    </>
  )
}

export default Search
