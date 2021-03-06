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

import * as Immutable from 'immutable';
import * as Kefir from 'kefir';
import * as SparqlJs from 'sparqljs';

import { Rdf } from 'platform/api/rdf';
import { SparqlClient, SparqlUtil } from 'platform/api/sparql';

import { CompositeValue, EmptyValue } from '../FieldValues';
import { parseQueryStringAsUpdateOperation, withNamedGraph } from './PersistenceUtils';
import { TriplestorePersistence, computeModelDiff } from './TriplestorePersistence';

export interface RawSparqlPersistenceConfig {
  type?: 'client-side-sparql';
  repository?: string;
  targetGraphIri?: string;
  targetInsertGraphIri?: string;
}

export class RawSparqlPersistence implements TriplestorePersistence {
  constructor(private config: RawSparqlPersistenceConfig = {}) {}

  persist(initialModel: CompositeValue | EmptyValue, currentModel: CompositeValue | EmptyValue): Kefir.Property<void> {
    const updateQueries =
      RawSparqlPersistence.createFormUpdateQueries(
        initialModel, currentModel, this.config.targetGraphIri, this.config.targetInsertGraphIri
      );
    if (updateQueries.size === 0) {
      return Kefir.constant<void>(undefined);
    }
    updateQueries.forEach((query) => {
      console.log(SparqlUtil.serializeQuery(query));
    });
    const { repository = 'default' } = this.config;
    const context: SparqlClient.QueryContext = { repository };
    const updateOperations = Kefir.zip<void>(
      updateQueries.map((query) => SparqlClient.executeSparqlUpdate(query, { context })).toArray()
    );
    return updateOperations
      .map(() => {
        /* void */
      })
      .toProperty();
  }

  static createFormUpdateQueries(
    initialModel: CompositeValue | EmptyValue,
    currentModel: CompositeValue | EmptyValue,
    targetGraphIri?: string,
    targetInsertGraphIri?: string,
  ): Immutable.List<SparqlJs.Update> {
    const entries = computeModelDiff(initialModel, currentModel);
    return Immutable.List(entries)
      .filter(({ definition }) => Boolean(definition.insertPattern && definition.deletePattern))
      .map(({ definition, subject, inserted, deleted }) => {
        const deleteQuery = withNamedGraph(
          parseQueryStringAsUpdateOperation(definition.deletePattern), targetGraphIri
        );
        const insertQuery =
          withNamedGraph(
            parseQueryStringAsUpdateOperation(definition.insertPattern),
            targetGraphIri || targetInsertGraphIri
          );
        return createFieldUpdateQueries(subject, deleteQuery, insertQuery, inserted, deleted);
      })
      .filter((update) => update.size > 0)
      .flatten()
      .toList();
  }
}

function createFieldUpdateQueries(
  subject: Rdf.Iri,
  deleteQuery: SparqlJs.Update | undefined,
  insertQuery: SparqlJs.Update | undefined,
  inserted: ReadonlyArray<Rdf.Node>,
  deleted: ReadonlyArray<Rdf.Node>
): Immutable.List<SparqlJs.Update> {
  let queries = Immutable.List<SparqlJs.Update>();

  if (deleted.length === 0 && inserted.length === 0) {
    return queries;
  }

  const paramterize = (query: SparqlJs.Update, value: Rdf.Node) =>
    SparqlClient.setBindings(query, {
      subject: subject,
      value: value,
    });

  if (deleteQuery) {
    queries = queries.concat(deleted.map((value) => paramterize(deleteQuery, value)));
  }
  if (insertQuery) {
    queries = queries.concat(inserted.map((value) => paramterize(insertQuery, value)));
  }
  return queries;
}
