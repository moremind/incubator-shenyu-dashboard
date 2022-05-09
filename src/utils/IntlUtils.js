/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import intl from 'react-intl-universal'
import locales from './locales'

export function initIntl(lang) {
  intl.init({
    currentLocale: lang,
    locales,
    // eslint-disable-next-line no-unused-vars
    warningHandler: message => {}
  })
}

export function getIntlContent(key, defaultValue) {
  return intl.get(key).defaultMessage(defaultValue);
}

export function groupBy(objectArray, property) {
  return objectArray.reduce((acc, obj) => {
    let key = obj[property]
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(obj)
    return acc
  }, {})
}

export function getCurrentLocale(locale) {
  if (locale === 'en-US') {
    return "English";
  } else {
    return "中文";
  }
}
