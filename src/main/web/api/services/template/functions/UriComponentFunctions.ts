/**
 * ResearchSpace
 * Copyright (C) 2020, © Trustees of the British Museum
 * Copyright (C) 2015-2019, metaphacts GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

export const UriComponentFunctions = {
  /**
   * Encodes a URI component.
   * @example
   * {{encodeUriComponent '?uri=http://example.com'}}
   */
  encodeUriComponent: function (uri: string) {
    return encodeURIComponent(uri);
  },
  /**
   * Decodes a URI component.
   * @example
   * {{decodeUriComponent '%3Furi%3Dhttp%3A%2F%2Fexample.com'}}
   */
  decodeUriComponent: function (uri: string) {
    return decodeURIComponent(uri);
  },
};
